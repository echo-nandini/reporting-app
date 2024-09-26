import { Component, ElementRef, Input, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-piechart',
  templateUrl: './piechart.component.html',
  styleUrls: ['./piechart.component.css'],
})
export class PiechartComponent implements OnInit {
  @Input() data: { type: string; value: number }[] = [];

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.createChart();
  }

  createChart(): void {
    const svg = d3.select(this.el.nativeElement).select('svg');
    const width = +svg.attr('width');
    const height = +svg.attr('height');
    const radius = Math.min(width, height) / 2 - 40;
    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2 + 10})`);

    const color = d3.scaleOrdinal(['#ff9999', '#66b3ff', '#99ff99', '#ffcc99']);

    const pie = d3.pie<{ type: string; value: number }>().value((d) => d.value);
    const arc = d3
      .arc<d3.PieArcDatum<{ type: string; value: number }>>()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = g
      .selectAll('.arc')
      .data(pie(this.data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', arc)
      .style('fill', (d: d3.PieArcDatum<{ type: string; value: number }>) =>
        color(d.data.type)
      )
      .on('mouseover', function (event, d) {
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip
          .html(`${abbreviateType(d.data.type)}: ${d.data.value}`)
          .style('left', event.pageX + 5 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    const tooltip = d3
      .select(this.el.nativeElement)
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', '#fff')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('padding', '5px');

    arcs
      .append('text')
      .attr(
        'transform',
        (d: d3.PieArcDatum<{ type: string; value: number }>) =>
          `translate(${arc.centroid(d)})`
      )
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .text((d: d3.PieArcDatum<{ type: string; value: number }>) =>
        abbreviateType(d.data.type)
      );

    function abbreviateType(type: string): string {
      switch (type) {
        case 'SERVICE_REQUEST':
          return 'SR';
        case 'CHANGE_REQUEST':
          return 'CR';
        case 'FAULT':
          return 'F';
        case 'USER_ACCESS':
          return 'UA';
        default:
          return type;
      }
    }
  }
}
