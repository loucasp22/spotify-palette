import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

const ScatterPlot = ({ data, onAlbumClick }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        // Scales
        // X: Hue (0-360)
        const xScale = d3.scaleLinear()
            .domain([0, 1]) // Vibrant returns HSL h as 0-1
            .range([margin.left, width - margin.right]);

        // Y: Lightness (0-1)
        const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([height - margin.bottom, margin.top]);

        // Draw circles
        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("image")
            .attr("xlink:href", d => d.imageUrl)
            .attr("x", d => xScale(d.color.hsl[0]) - 25) // Center image
            .attr("y", d => yScale(d.color.hsl[2]) - 25)
            .attr("width", 50)
            .attr("height", 50)
            .attr("clip-path", "circle(25px at center)") // Make it round
            .style("cursor", "pointer")
            .on("mouseover", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("width", 80)
                    .attr("height", 80)
                    .attr("x", d => xScale(d.color.hsl[0]) - 40)
                    .attr("y", d => yScale(d.color.hsl[2]) - 40)
                    .style("z-index", 100);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("width", 50)
                    .attr("height", 50)
                    .attr("x", d => xScale(d.color.hsl[0]) - 25)
                    .attr("y", d => yScale(d.color.hsl[2]) - 25)
                    .style("z-index", 1);
            })
            .on("click", (event, d) => onAlbumClick(d));

    }, [data, onAlbumClick]);

    return (
        <svg
            ref={svgRef}
            width="100%"
            height="100vh"
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 0 }}
        />
    );
};

export default ScatterPlot;
