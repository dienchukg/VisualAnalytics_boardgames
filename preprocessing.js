export function parse_numbers(obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (!isNaN(value) && value !== null && value !== '') {
        obj[key] = parseFloat(value);
      }
    }
  }
  return obj;
}


export function filterTopRankedGames(games, topRank) {
  return games.filter(game => parseInt(game.rank) <= topRank);
}


export function selectGamesByCategory(games, category) {
  if (category === 'all') {
    return games;
  } else {
    return games.filter(game => {
      return game.category.split(',').map(cat => cat.trim()).includes(category);
    });
  }
}
export function selectGamesByMechanic(games, mechanic) {
  if (mechanic === 'all') {
    return games;
  } else{
  return games.filter(game => {
    return game.mechanic.split(',').map(mech => mech.trim()).includes(mechanic);
  });
  }
}

export function in_top_5_popular_categories(games) {
  const top_5_categories = [
    'Adventure', 'Exploration', 'Fantasy', 'Fighting', 'Miniatures'
  ];

  games.forEach(game => {
    game.in_top_5_cat = game.category.split(',').some(cat => top_5_categories.includes(cat.trim()));
  });
  return games;
}


export function in_top_5_popular_mechanics(games) {
  const top_5_mechanics = [
    'Hand Management',
    'Solo / Solitaire Game',
    'Variable Player Powers',
    'Variable Set-up',
    'Worker Placement'
  ];

  games.forEach(game => {
    game.in_top_5_mech = game.mechanic.split(',').some(mech => top_5_mechanics.includes(mech.trim()));
  });
  return games;
}



export function removeColumnsWithMissingValues(data){
  // if a column has under 990 non null values, remove it
  const threshold = 990;
  let columns = data.columns;
  let rows = data.rows;
  let columnsToRemove = [];
  columns.forEach(column => {
    let nonNullValues = rows.filter(row => row[column] !== null).length;
    if(nonNullValues < threshold){
      columnsToRemove.push(column);
    }
  })
  columnsToRemove.forEach(column => {
    delete data[column];
  })
  return data;
}

export function removeRowsWithMissingValues(data){
  let rows = data.rows;
  let columns = data.columns;
  let rowsToRemove = [];
  rows.forEach(row => {
    let missingValues = columns.filter(column => row[column] === null).length;
    if(missingValues > 0){
      rowsToRemove.push(row);
    }
  })
}
export function mergeTwoDatasets(data1,data2){
  //merge on left join, key is game_id from data1 and id from data2
  let mergedData = data1.map(row => {
    let row2 = data2.find(row2 => row2.bgg_id === row.ID);
    return {...row, ...row2};
  })
}

export function extractRelevantColumns(data, parameters) {
  return data.map(row => {
    let newRow = {};
    newRow['Name'] = row['Name'];
    parameters.forEach(column => {
      if (column === 'game_type') {
        // Extract 8 binary columns
        let gameType = row[column];
        
        newRow['Abstract_Game'] = gameType.includes('Abstract Game') ? 1 : 0;
        newRow['Children_Game'] = gameType.includes("Children's Game") ? 1 : 0;
        newRow['Customizable'] = gameType.includes('Customizable') ? 1 : 0;
        newRow['Family_Game'] = gameType.includes('Family Game') ? 1 : 0;
        newRow['Party_Game'] = gameType.includes('Party Game') ? 1 : 0;
        newRow['Strategy_Game'] = gameType.includes('Strategy Game') ? 1 : 0;
        newRow['Thematic'] = gameType.includes('Thematic') ? 1 : 0;
        newRow['War_Game'] = gameType.includes('War Game') ? 1 : 0;
      } else {
        newRow[column] = row[column];
      }
    });
    
    return newRow;
  });
 
}

export function normalizeData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Data should be a non-empty array');
  }

  // Extract column names from the first data object
  let columns = Object.keys(data[0]);
  let normalizedData = data.map(row => ({ Name: row.Name })); // Initialize with names

  columns.forEach(column => {
    if (column !== 'Name') {
      let values = data.map(row => parseFloat(row[column]));
      
      // Filter out non-numeric values
      values = values.filter(value => !isNaN(value));

      if (values.length === 0) {
        normalizedData.forEach(row => row[column] = 0);
        return;
      }

      let min = Math.min(...values);
      let max = Math.max(...values);

      // Handle case where max and min are the same to avoid division by zero
      if (max === min) {
        normalizedData.forEach(row => row[column] = 0);
      } else {
        data.forEach((row, index) => {
          let value = parseFloat(row[column]);
          normalizedData[index][column] = isNaN(value) ? 0 : (value - min) / (max - min);
        });
      }
    }
  });

  return normalizedData;
}

export function transformToKMeansInput(normalizedData) {
  return normalizedData.map(row => ({
    name: row.Name,
    dataPoint: Object.keys(row).filter(key => key !== 'Name').map(key => row[key])
  }));
}


export function transformFromKMeansOutput(kMeansResults, originalKeys) {
  const transformedData = {};

  // Initialize the transformedData object with empty arrays for each key
  originalKeys.forEach(key => {
    transformedData[key] = [];
  });

  // Populate the transformedData object
  kMeansResults.forEach(result => {
    result.dataPoint.forEach((value, index) => {
      transformedData[originalKeys[index]].push(value);
    });
  });

  // Add centroid index to the transformedData as the last feature column
  
  transformedData.centroidIndex = kMeansResults.map(result => result.centroidIndex);


  return transformedData;
}