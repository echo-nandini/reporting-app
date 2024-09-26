import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FileUploadService } from '../service/file-upload.service';
import { NotificationService } from '../service/notification.service';
import { TicketService } from '../service/ticket.service';
import { Ticket } from '../models/ticket';
import * as d3 from 'd3';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-dashboard-manager',
  templateUrl: './dashboard-manager.component.html',
  styleUrls: ['./dashboard-manager.component.css'],
})
export class DashboardManagerComponent implements OnInit {
  username: string | null = '';
  tickets: Ticket[] = [];
  totalTickets: number = 0;
  priorityData: { label: string; value: number }[] = [];
  animatedValues: { [key: string]: number } = {
    Highest: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };
  issueData: { type: string; value: number }[] = [];
  selectedFile: File | null = null;
  minDate: Date | null = null;
  maxDate: Date | null = null;
  stackedBarData: any[] = [];
  displayedColumns: string[] = [
    'id',
    'issueType',
    'key',
    'reporter',
    'assignee',
    'priority',
    'status',
    'resolution',
    'created',
    'updated',
    'changePriority',
    'components',
    'faultPriority',
    'issuePriority',
    'appName',
    'defectPriority',
    'servicePriority',
  ];

  dataSource = new MatTableDataSource<Ticket>([]);

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private fileUploadService: FileUploadService,
    private notificationService: NotificationService,
    private ticketService: TicketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.ticketService.loadTickets().subscribe((data: Ticket[]) => {
      this.tickets = data;
      console.log(this.tickets);
      this.prepareIssueData();
      this.preparePriorityData();
      this.animateProgressBars();
      this.calculateDateRange();
      this.prepareStackedBarData();
      this.createStackedBarChart();
      this.loadTickets();

      this.tickets.forEach((ticket) => {
        ticket.withinKPI = this.calculateWithinKPI(ticket) === 1;
        ticket.outsideKPI = this.calculateOutsideKPI(ticket) === 1;
      });

      this.createKPIBarChart(this.tickets);
    });
  }

  calculateWithinKPI(ticket: Ticket): number {
    const created = new Date(ticket.created);
    const resolved = new Date(ticket.updated);
    const diffHours =
      (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);

    switch (ticket.priority) {
      case 'HIGHEST':
        return diffHours <= 1 ? 1 : 0;
      case 'HIGH':
        return diffHours <= 2 ? 1 : 0;
      case 'MEDIUM':
        return diffHours <= 8 ? 1 : 0;
      case 'LOW':
        return diffHours <= 48 ? 1 : 0;
      default:
        return 0;
    }
  }

  getProgressValue(value: number): string {
    const progress = (value / this.totalTickets) * 283;
    return `${progress}, 283`;
  }

  calculateOutsideKPI(ticket: Ticket): number {
    const created = new Date(ticket.created);
    const resolved = new Date(ticket.updated);
    const diffHours =
      (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 60);

    switch (ticket.priority) {
      case 'HIGHEST':
        return diffHours > 1 ? 1 : 0;
      case 'HIGH':
        return diffHours > 2 ? 1 : 0;
      case 'MEDIUM':
        return diffHours > 8 ? 1 : 0;
      case 'LOW':
        return diffHours > 48 ? 1 : 0;
      default:
        return 0;
    }
  }

  preparePriorityData(): void {
    this.totalTickets = this.tickets.length;
    const priorityCount = { highest: 0, high: 0, medium: 0, low: 0 };

    this.tickets.forEach((ticket) => {
      switch (ticket.priority) {
        case 'HIGHEST':
          priorityCount.highest++;
          break;
        case 'HIGH':
          priorityCount.high++;
          break;
        case 'MEDIUM':
          priorityCount.medium++;
          break;
        case 'LOW':
          priorityCount.low++;
          break;
      }
    });

    this.priorityData = [
      { label: 'Highest', value: priorityCount.highest },
      { label: 'High', value: priorityCount.high },
      { label: 'Medium', value: priorityCount.medium },
      { label: 'Low', value: priorityCount.low },
    ];
  }

  animateProgressBars(): void {
    this.priorityData.forEach((priority) => {
      const targetValue = (priority.value / this.totalTickets) * 100;
      let currentValue = 0;

      const interval = setInterval(() => {
        if (currentValue >= targetValue) {
          clearInterval(interval);
          this.animatedValues[priority.label] = Math.round(targetValue);
        } else {
          currentValue += 1;
          this.animatedValues[priority.label] = currentValue;
        }
      }, 20);
    });
  }

  prepareIssueData(): void {
    const issueTypeCount: { [key: string]: number } = {};

    this.tickets.forEach((ticket) => {
      if (issueTypeCount[ticket.issueType]) {
        issueTypeCount[ticket.issueType]++;
      } else {
        issueTypeCount[ticket.issueType] = 1;
      }
    });

    this.issueData = Object.entries(issueTypeCount).map(([type, value]) => ({
      type,
      value,
    }));
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.uploadFile();
  }

  uploadFile() {
    if (this.selectedFile) {
      this.fileUploadService.uploadFile(this.selectedFile).subscribe(
        (response) => {
          this.notificationService.showNotification(
            'File Upload Successful',
            'success'
          );
        },
        (error) => {
          console.error('Upload failed:', error);
        }
      );
    }
  }

  calculateDateRange(): void {
    if (this.tickets.length > 0) {
      const dates = this.tickets.map((ticket) => new Date(ticket.created));
      this.minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      this.maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    }
  }

  prepareStackedBarData(): void {
    const assigneeMap: {
      [assignee: string]: {
        highest: number;
        high: number;
        medium: number;
        low: number;
        null: number;
      };
    } = {};

    this.tickets.forEach((ticket) => {
      const assignee = ticket.assignee || 'Unassigned';

      if (!assigneeMap[assignee]) {
        assigneeMap[assignee] = {
          highest: 0,
          high: 0,
          medium: 0,
          low: 0,
          null: 0,
        };
      }

      switch (ticket.priority) {
        case 'HIGHEST':
          assigneeMap[assignee].highest++;
          break;
        case 'HIGH':
          assigneeMap[assignee].high++;
          break;
        case 'MEDIUM':
          assigneeMap[assignee].medium++;
          break;
        case 'LOW':
          assigneeMap[assignee].low++;
          break;
        case null:
          assigneeMap[assignee].null++;
      }
    });

    this.stackedBarData = Object.keys(assigneeMap).map((assignee) => ({
      assignee,
      highest: assigneeMap[assignee].highest,
      high: assigneeMap[assignee].high,
      medium: assigneeMap[assignee].medium,
      low: assigneeMap[assignee].low,
    }));
  }

  createStackedBarChart(): void {
    const margin = { top: 40, right: 30, bottom: 40, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select('svg#stacked-bar-chart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(this.stackedBarData.map((d) => d['assignee'] as string))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(
          this.stackedBarData,
          (d) => (d.highest + d.high + d.medium + d.low) as number
        )!,
      ])
      .nice()
      .range([height, 0]);

    const color = d3
      .scaleOrdinal<string>()
      .domain(['highest', 'high', 'medium', 'low'])
      .range(['#d32f2f', '#f57c00', '#1976d2', '#388e3c']);

    const stackData = d3.stack().keys(['highest', 'high', 'medium', 'low'])(
      this.stackedBarData as any
    );

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Engineer wise ticket assignment');

    svg
      .append('g')
      .selectAll('g')
      .data(stackData)
      .join('g')
      .attr('fill', (d: any) => color(d.key) as string)
      .selectAll('rect')
      .data((d: any) => d)
      .join('rect')
      .attr('x', (d: any) => x(d.data['assignee'])!)
      .attr('y', (d: any) => y(d[1]))
      .attr('height', (d: any) => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth());

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g').call(d3.axisLeft(y));

    const legend = svg
      .append('g')
      .attr('transform', `translate(0,${height + 20})`);

    const legendColors = ['#d32f2f', '#f57c00', '#1976d2', '#388e3c'];
    const legendLabels = ['Highest', 'High', 'Medium', 'Low'];

    legend
      .selectAll('.legend-item')
      .data(legendLabels)
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(${i * 100}, 0)`)
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', (d, i) => legendColors[i]);

    legend
      .selectAll('.legend-item')
      .append('text')
      .attr('x', 25)
      .attr('y', 15)
      .text((d: any) => d);

    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    svg
      .selectAll('rect')
      .on('mouseover', (event, d: any) => {
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip
          .html(
            `Total: Highest: ${d.data.highest}, High: ${d.data.high}, Medium: ${d.data.medium}, Low: ${d.data.low}`
          )
          .style('left', `${event.pageX}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });
  }

  loadTickets(): void {
    this.dataSource = new MatTableDataSource<Ticket>(this.tickets);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  createKPIBarChart(tickets: any[]): void {
    const margin = { top: 40, right: 30, bottom: 80, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select('svg#kpi-bar-chart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('KPI Adherence Year-wise Report');

    const groupedData = d3
      .groups(tickets, (d) => {
        const date = new Date(d.created);
        if (isNaN(date.getTime())) {
          console.error(`Invalid date found: ${d.created}`);
          return null;
        }
        return date.getFullYear();
      })
      .filter(([, group]) => group.length > 0);

    const data = groupedData.map(([year, group]) => {
      const withinKPI = group.filter((ticket) => ticket.withinKPI).length;
      const outsideKPI = group.filter((ticket) => !ticket.withinKPI);
      return {
        year: year as number,
        withinKPI,
        outsideKPI: {
          total: outsideKPI.length,
          resolved: outsideKPI.filter((ticket) => ticket.resolution === 'DONE')
            .length,
          unresolved: outsideKPI.filter(
            (ticket) =>
              ticket.resolution === 'UNRESOLVED' ||
              ticket.resolution === 'INCOMPLETE'
          ).length,
        },
      };
    });

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.year.toString()))
      .range([0, width])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data, (d) => Math.max(d.withinKPI, d.outsideKPI.total)) || 0,
      ])
      .nice()
      .range([height, 0]);

    const xAxis = svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    const yAxis = svg.append('g').call(d3.axisLeft(y));

    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', '#fff')
      .style('border', '1px solid #ccc')
      .style('border-radius', '5px')
      .style('padding', '5px')
      .style('opacity', 0);

    svg
      .selectAll('.bar-within')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-within')
      .attr('x', (d) => x(d.year.toString())!)
      .attr('y', (d) => y(d.withinKPI))
      .attr('width', x.bandwidth() / 2)
      .attr('height', (d) => height - y(d.withinKPI))
      .attr('fill', '#76b041');

    const outsideX = d3
      .scaleBand()
      .domain(data.map((d) => d.year.toString()))
      .range([0, width])
      .padding(0.2);

    svg
      .selectAll('.bar-outside-resolved')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-outside-resolved')
      .attr('x', (d) => outsideX(d.year.toString())! + x.bandwidth() / 2)
      .attr('y', (d) => y(d.outsideKPI.resolved))
      .attr('width', x.bandwidth() / 2)
      .attr('height', (d) => height - y(d.outsideKPI.resolved))
      .attr('fill', '#3f51b5') 
      .on('mouseover', function (event, d) {
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip
          .html(
            `Resolved within KPI: ${d.withinKPI}<br>
                  Unresolved outside KPI: ${d.outsideKPI.unresolved}<br>
                  Resolved outside KPI: ${d.outsideKPI.resolved}`
          )
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', function () {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    svg
      .selectAll('.bar-outside-unresolved')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-outside-unresolved')
      .attr('x', (d) => outsideX(d.year.toString())! + x.bandwidth() / 2)
      .attr('y', (d) => y(d.outsideKPI.resolved + d.outsideKPI.unresolved))
      .attr('width', x.bandwidth() / 2)
      .attr('height', (d) => height - y(d.outsideKPI.unresolved))
      .attr('fill', '#f44336')
      .on('mouseover', function (event, d) {
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip
          .html(
            `Resolved within KPI: ${d.withinKPI}<br>
                  Unresolved outside KPI: ${d.outsideKPI.unresolved}<br>
                  Resolved outside KPI: ${d.outsideKPI.resolved}`
          )
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', function () {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    const legend = svg
      .append('g')
      .attr('transform', `translate(${width / 4}, ${height + 20})`);

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', '#76b041');

    legend
      .append('text')
      .attr('x', 25)
      .attr('y', 15)
      .text('Resolved within KPI');

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 20)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', '#3f51b5');

    legend
      .append('text')
      .attr('x', 25)
      .attr('y', 35)
      .text('Resolved outside KPI');

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 40)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', '#f44336');

    legend
      .append('text')
      .attr('x', 25)
      .attr('y', 55)
      .text('Unresolved outside KPI');

    xAxis
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', margin.bottom - 10)
      .attr('fill', 'black')
      .text('Year');

    yAxis
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('x', -(height / 2))
      .attr('y', -margin.left + 20)
      .attr('transform', 'rotate(-90)')
      .attr('fill', 'black')
      .text('Ticket Count');
  }
}
