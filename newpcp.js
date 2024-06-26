import * as d3 from "d3";

function drawPcp(data) {
    const margin = { top: 50, bottom: 50, left: 80, right: 80 };
    const width = 1050;
    const height = d3.select(".pcp").node().getBoundingClientRect().height;

    const attributes = [
        { name: "minplayers", range: d3.extent(data, d => +d.minplayers) },
        { name: "year", range: d3.extent(data, d => +d.year) },
        { name: "minplaytime", range: d3.extent(data, d => +d.minplaytime) },
        { name: "maxplaytime", range: d3.extent(data, d => +d.maxplaytime) },
        { name: "minage", range: d3.extent(data, d => +d.minage) },
        { name: "rating", range: d3.extent(data, d => +d.rating) },
        { name: "num_of_reviews", range: d3.extent(data, d => +d.num_of_reviews) },
        { name: "maxplayers", range: d3.extent(data, d => +d.maxplayers) }
    ];

    const xScale = d3.scalePoint()
        .domain(attributes.map(d => d.name))
        .range([margin.left, width - margin.right]);

    const yScales = {};
    attributes.forEach(attr => {
        yScales[attr.name] = d3.scaleLinear()
            .domain(attr.range)
            .range([height - margin.bottom, margin.top]);
    });

    const lineGenerator = d3.line();
    const linePath = function(d) {
        const points = attributes.map(attr => [xScale(attr.name), yScales[attr.name](d[attr.name])]);
        return lineGenerator(points);
    };

    // Clear any existing SVG
    d3.select(".pcp").selectAll("*").remove();

    const pcp = d3.select(".pcp")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const gameNameDiv = d3.select(".pcp").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("background-color", "lightblue")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute")
        .style("pointer-events", "none");

    function handleMouseOver(event, d) {
        d3.select(this).attr("stroke", "orange");
        
        gameNameDiv.transition().duration(200).style("opacity", 1);
        gameNameDiv.html(`
            <strong>Title:</strong> ${d.title}<br>
            <strong>Rank:</strong> ${d.rank}<br>
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    }

    function handleMouseOut(d) {
        d3.select(this).attr("stroke", "steelblue");
        gameNameDiv.transition().duration(500).style("opacity", 0);
    }

    pcp.append("g")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("d", d => linePath(d))
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1)
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    const featureAxisG = pcp.selectAll('g.feature')
        .data(attributes)
        .enter()
        .append('g')
        .attr('class', 'feature')
        .attr('transform', d => `translate(${xScale(d.name)},0)`);

    featureAxisG.append('g')
        .each(function(d) {
            d3.select(this).call(d3.axisLeft(yScales[d.name]));
        });

    featureAxisG.append('text')
        .attr('y', height - margin.bottom)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text(d => {
            switch (d.name) {
                case "year": return "Year";
                case "minplayers": return "Min Players";
                case "maxplayers": return "Max Players";
                case "minplaytime": return "Min Playtime";
                case "maxplaytime": return "Max Playtime";
                case "minage": return "Min Age";
                case "rating": return "Rating";
                case "num_of_reviews": return "Number of Reviews";
                default: return d.name;
            }
        });
}

export { drawPcp };
