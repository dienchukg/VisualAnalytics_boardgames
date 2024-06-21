import { parse } from "csv-parse";
import * as fs from "fs";
import { print_clientConnected, print_clientDisconnected } from "./static/utils.js";
import { TSNE } from "./tsne.js";
import {
  filterTopRankedGames,
  selectGamesByCategory,
  selectGamesByMechanic,
  in_top_5_popular_categories,
  in_top_5_popular_mechanics,
  parse_numbers
} from "./preprocessing.js";
import {
  extractRelevantColumns,
  normalizeData,
  transformToKMeansInput,
  transformFromKMeansOutput
} from "./preprocessing.js";
import { kMeans } from "./kmeans.js";
import { LDA } from "./druidExample.js";

const file_path = "./data/";
const file_name_csv = "cleaned data ver 1.csv";

/**
 * Does some console.logs when a client connected.
 * Also sets up the listener, if the client disconnects.
 * @param {*} socket 
 */
export function setupConnection(socket) {
  print_clientConnected(socket.id);

  /**
   * Listener that is called, if client disconnects.
   */
  socket.on("disconnect", () => {
    print_clientDisconnected(socket.id);
  });

  socket.on("getDataByCategory", (obj) => {
    console.log(`Data request with properties ${JSON.stringify(obj)}...`);
    let parameters = obj.parameters;
    let data = [];

    fs.createReadStream(file_path + file_name_csv)
      .pipe(parse({ delimiter: ',', columns: true }))
      .on('data', (row) => {
        row = parse_numbers(row); // Parse numbers in the row
        data.push(row);
      })
      .on('end', () => {
        console.log("CSV data loaded:", data.length, "records"); // Debug output
        let dataByCategory = selectGamesByCategory(data, parameters);
        socket.emit("DataByCategory", {
          timestamp: new Date().getTime(),
          data: dataByCategory,
          parameters: parameters,
        });
        console.log("Data by category:", dataByCategory);
      })
      .on('error', (err) => {
        console.error("Error reading CSV:", err);
        socket.emit("Error", {
          timestamp: new Date().getTime(),
          error: "Error reading CSV data"
        });
      });
  });

  socket.on("getData", (obj) => {
    console.log(`Data request with properties ${JSON.stringify(obj)}...`);
    let parameters = obj.parameters;
    let data = [];

    fs.createReadStream(file_path + file_name_csv)
      .pipe(parse({ delimiter: ',', columns: true }))
      .on('data', (row) => {
        row = parse_numbers(row); // Parse numbers in the row
        data.push(row);
      })
      .on('end', () => {
        console.log("CSV data loaded:", data.length, "records"); // Debug output
        let filteredData = applyFilters(data, parameters);
        socket.emit("freshData", {
          timestamp: new Date().getTime(),
          data: filteredData,
          parameters: parameters,
        });
      })
      .on('error', (err) => {
        console.error("Error reading CSV:", err);
        socket.emit("Error", {
          timestamp: new Date().getTime(),
          error: "Error reading CSV data"
        });
      });
  });

  socket.on("getLDA", (obj) => {
    console.log(`Data request with properties ${JSON.stringify(obj)}...`);
    let parameters = obj.parameters;
    let data = [];

    fs.createReadStream(file_path + file_name_csv)
      .pipe(parse({ delimiter: ',', columns: true }))
      .on('data', (row) => {
        row = parse_numbers(row); // Parse numbers in the row
        data.push(row);
      })
      .on('end', () => {
        console.log("CSV data loaded:", data.length, "records"); // Debug output
        let dataFilter = applyFilters(data, parameters);
        in_top_5_popular_categories(dataFilter);
        in_top_5_popular_mechanics(dataFilter);
        let lda = LDA(dataFilter, parameters.setClass);

        socket.emit("freshLDA", {
          timestamp: new Date().getTime(),
          data: lda,
          parameters: parameters,
        });
      })
      .on('error', (err) => {
        console.error("Error reading CSV:", err);
        socket.emit("Error", {
          timestamp: new Date().getTime(),
          error: "Error reading CSV data"
        });
      });
  });

  socket.on("getRelevantData", (obj) => {
    let parameters = obj.parameters;
    let data = [];

    fs.createReadStream(file_path + file_name_csv)
      .pipe(parse({ delimiter: ',', columns: true }))
      .on('data', (row) => {
        row = parse_numbers(row); // Parse numbers in the row
        data.push(row);
      })
      .on('end', () => {
        console.log("CSV data loaded:", data.length, "records"); // Debug output
        let relevantData = filterTopRankedGames(data, parameters.top_rank);
        relevantData = extractRelevantColumns(relevantData, parameters.features);
        relevantData = normalizeData(relevantData);
        relevantData = transformToKMeansInput(relevantData);
        relevantData = kMeans(relevantData, parameters.k, parameters.importance, parameters.distanceFunction);

        socket.emit("RelevantData", {
          timestamp: new Date().getTime(),
          data: relevantData,
          parameters: parameters,
        });
      })
      .on('error', (err) => {
        console.error("Error reading CSV:", err);
        socket.emit("Error", {
          timestamp: new Date().getTime(),
          error: "Error reading CSV data"
        });
      });
  });
}

function applyFilters(data, filters) {
  let filteredData = data.slice(); // Copy the original data to avoid modifying it directly

  // Apply each filter function
  for (let filterName in filters) {
    if (filters.hasOwnProperty(filterName)) {
      const filterValue = filters[filterName];
      filteredData = applyFilter(filteredData, filterName, filterValue);
    }
  }

  return filteredData;
}

function applyFilter(data, filterName, filterValue) {
  switch (filterName) {
    case "category":
      return selectGamesByCategory(data, filterValue);
    case "top_rank":
      return filterTopRankedGames(data, filterValue);
    case "mechanic":
      return selectGamesByMechanic(data, filterValue);
    // Add more cases for additional filters as needed
    default:
      return data;
  }
}
