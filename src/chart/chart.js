import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import * as hb from "d3-hexbin";
import * as topojson from "topojson";
import mx from "../data/mx_tj.json";
import inegi from "../data/inegi.tsv";

export const ChartComponent = () => {
  const chartContainer = useRef();
  const width = 960;
  const height = 620;

  useEffect(() => {
    // Herramienta de d3 para generar escala de coordenadas
    const projection = d3
      .geoConicConformal()
      .rotate([102, 0])
      .center([0, 24])
      .parallels([17.5, 29.5])
      .scale(1850)
      .translate([width / 2, height / 2]);

    // Escala de tamaños dado los valores
    const radius = d3.scaleSqrt().domain([4, 5.1]).range([0, 2]);

    // Parse de archivo tsv a información
    const data = d3.tsvParse(inegi, (d) => {
      const p = projection(d);
      p.population = d.population;
      return p;
    });

    // Escala de color
    const color = d3.scaleSequential(
      d3.extent(data, (d) => d.population),
      d3.interpolateSpectral
    );

    // Generador de hexbin
    const hexbin = hb.hexbin().extent([0, 0], [width, height]).radius(10);

    const svg = d3
      .select(chartContainer.current)
      .append("svg")
      .attr("id", "chart")
      .attr("viewBox", [0, 0, width, height]);

    svg
      .append("path")
      .datum(topojson.mesh(mx, mx.objects.states))
      .attr("fill", "none")
      .attr("stroke", "#777")
      .attr("stroke-width", 0.5)
      .attr("stroke-linejoin", "round")
      .attr("d", d3.geoPath().projection(projection));

    svg
      .append("g")
      .attr("class", "hexagon")
      .selectAll("path")
      .data(
        hexbin(data).sort((a, b) => {
          return b.length - a.length;
        })
      )
      .enter()
      .append("path")
      .attr("d", (d) => {
        return hexbin.hexagon(radius(d.length));
      })
      .attr("transform", (d) => {
        return "translate(" + d.x + "," + d.y + ")";
      })
      .attr("fill", (d) => color(d3.median(d, (d) => +d.population)));

    return () => {
      svg.selectAll("*").remove();
    };
  }, [width, height]);

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h2>Porcentaje de mujeres de 20 a 24 años</h2>
      </div>
      <div
        id="chart"
        className={"svg-canvas"}
        style={{ position: "relative", textAlign: "center" }}
        ref={chartContainer}
      />
      <p>
        INEGI 2020 https://www.inegi.org.mx/temas/estructura/default.html#Mapas
      </p>
    </>
  );
};
