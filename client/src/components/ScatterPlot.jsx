import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ScatterPlot = ({ data, onAlbumClick }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        // Create a group for the chart content
        const g = svg.append("g");

        // Definitions for Gradients
        const defs = svg.append("defs");

        // Hue Gradient
        const hueGradient = defs.append("linearGradient")
            .attr("id", "hue-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        hueGradient.selectAll("stop")
            .data([
                { offset: "0%", color: "#ff0000" },
                { offset: "17%", color: "#ffff00" },
                { offset: "33%", color: "#00ff00" },
                { offset: "50%", color: "#00ffff" },
                { offset: "67%", color: "#0000ff" },
                { offset: "83%", color: "#ff00ff" },
                { offset: "100%", color: "#ff0000" }
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        // Brightness Gradient
        const brightnessGradient = defs.append("linearGradient")
            .attr("id", "brightness-gradient")
            .attr("x1", "0%")
            .attr("y1", "100%") // Bottom (Dark)
            .attr("x2", "0%")
            .attr("y2", "0%");  // Top (Light)

        brightnessGradient.selectAll("stop")
            .data([
                { offset: "0%", color: "#000000" },
                { offset: "100%", color: "#ffffff" }
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        // Scales
        // X: Hue (0-1 from Vibrant -> 0-360 degrees)
        const xScale = d3.scaleLinear()
            .domain([0, 1])
            .range([margin.left, width - margin.right]);

        // Y: Lightness (0-1)
        const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([height - margin.bottom, margin.top]);

        // Axes
        const xAxis = d3.axisBottom(xScale)
            .ticks(10)
            .tickFormat(d => `${Math.round(d * 360)}°`);

        const yAxis = d3.axisLeft(yScale)
            .ticks(10)
            .tickFormat(d => `${Math.round(d * 100)}%`);

        // Add Axes Groups
        const xAxisG = g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(xAxis);

        const yAxisG = g.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis);

        // Gradient Bars
        const hueBar = g.append("rect")
            .attr("x", margin.left)
            .attr("y", height - margin.bottom + 5) // Just below axis
            .attr("width", width - margin.left - margin.right)
            .attr("height", 10)
            .style("fill", "url(#hue-gradient)");

        const brightnessBar = g.append("rect")
            .attr("x", margin.left - 15) // Just left of axis
            .attr("y", margin.top)
            .attr("width", 10)
            .attr("height", height - margin.bottom - margin.top)
            .style("fill", "url(#brightness-gradient)");

        // Axis Labels
        g.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height - 20)
            .attr("fill", "white")
            .style("font-size", "12px")
            .text("Hue (Color Wheel)");

        g.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", 20)
            .attr("fill", "white")
            .style("font-size", "12px")
            .text("Brightness");

        // Style Axes (Dark Mode)
        const styleAxes = () => {
            g.selectAll(".domain, .tick line").attr("stroke", "#555");
            g.selectAll(".tick text").attr("fill", "#aaa");
        };
        styleAxes();

        // Draw circles (images)
        const points = g.selectAll("image")
            .data(data)
            .enter()
            .append("image")
            .attr("xlink:href", d => d.imageUrl)
            .attr("x", d => xScale(d.color.hsl[0]) - 25)
            .attr("y", d => yScale(d.color.hsl[2]) - 25)
            .attr("width", 50)
            .attr("height", 50)
            .attr("clip-path", "circle(25px at center)")
            .style("cursor", "pointer")
            .on("click", (event, d) => onAlbumClick(d));

        // Hover effects
        points
            .on("mouseover", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("width", 80)
                    .attr("height", 80)
                    .attr("transform", "translate(-15, -15)")
                    .style("z-index", 100);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("width", 50)
                    .attr("height", 50)
                    .attr("transform", "translate(0, 0)")
                    .style("z-index", 1);
            });

        // Zoom Behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 5])
            .on("zoom", (event) => {
                const transform = event.transform;

                // Rescale axes
                const newXScale = transform.rescaleX(xScale);
                const newYScale = transform.rescaleY(yScale);

                xAxisG.call(xAxis.scale(newXScale));
                yAxisG.call(yAxis.scale(newYScale));

                styleAxes();

                // Update points position
                points
                    .attr("x", d => newXScale(d.color.hsl[0]) - 25)
                    .attr("y", d => newYScale(d.color.hsl[2]) - 25);

                // Update Gradient Bars
                // The bar represents the domain [0, 1]. We project 0 and 1 using the new scale.
                hueBar
                    .attr("x", newXScale(0))
                    .attr("width", newXScale(1) - newXScale(0));

                brightnessBar
                    .attr("y", newYScale(1)) // Top (1 is top? No, 1 is usually top in graph, but y goes down. Wait. yScale domain [0,1] range [height, top]. So 1 is top (small y), 0 is bottom (large y).)
                    // Actually, yScale(1) is margin.top (small value). yScale(0) is height-margin.bottom (large value).
                    // Rect y should be the top-most value, which is yScale(1).
                    // Height should be yScale(0) - yScale(1).
                    .attr("y", newYScale(1))
                    .attr("height", newYScale(0) - newYScale(1));
            });

        svg.call(zoom);

    }, [data, onAlbumClick]);

    return (
        <svg
            ref={svgRef}
            width="100%"
            height="100vh"
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, backgroundColor: '#121212' }}
        />
    );
};

export default ScatterPlot;
