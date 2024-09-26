import { Component, ElementRef, ViewChild } from '@angular/core';
import { FileUploadService } from '../service/file-upload.service';
import { NotificationService } from '../service/notification.service';
import { TicketService } from '../service/ticket.service';
import { AuthService } from '../service/auth.service';
import { Ticket } from '../models/ticket';
import * as d3 from 'd3';
import { ResolveEnd } from '@angular/router';

@Component({
  selector: 'app-dashboard-exec',
  templateUrl: './dashboard-exec.component.html',
  styleUrls: ['./dashboard-exec.component.css'],
})
export class DashboardExecComponent {
  username: string | null = '';
  tickets: Ticket[] = [];
  totalTickets: number = 0;
  minDate: Date | null = null;
  maxDate: Date | null = null;
  selectedFile: File | null = null;
  priorityData: { label: string; value: number }[] = [];
  animatedValues: { [key: string]: number } = {
    Total: 0,
    Resolved: 0,
    ResolvedWithinKPI: 0,
    Unresolved: 0,
  };

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('chart') chartContainer!: ElementRef;
  @ViewChild('yearlyChart', { static: true }) yearlyChart!: ElementRef;
  @ViewChild('monthlyChart', { static: true }) monthlyChart!: ElementRef;
  @ViewChild('assigneeChart', { static: true }) assigneeChart!: ElementRef;
  @ViewChild('appNameChart', { static: true }) appNameChart!: ElementRef;

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
      this.totalTickets = this.tickets.length;
      this.calculateDateRange();
      this.calculateAnimatedValues();
      this.createYearlyLineChart();
      this.createMonthlyTrend2024Chart();
      this.createAssigneeKPIChart();
      this.createStackedBarChart();
    });
  }

  calculateAnimatedValues(): void {
    let resolvedCount = 0;
    let unresolvedCount = 0;
    let resolvedWithinKPI = 0;

    this.tickets.forEach((ticket) => {
      if (ticket.resolution === 'DONE') {
        resolvedCount++;
      } else if (ticket.resolution === 'UNRESOLVED') {
        unresolvedCount++;
      }
    });

    this.animatedValues['Total'] = this.totalTickets;
    this.animatedValues['Resolved'] = resolvedCount;
    this.animatedValues['Unresolved'] = unresolvedCount;

    this.priorityData = [
      { label: 'Total', value: this.totalTickets },
      { label: 'Resolved', value: resolvedCount },
      { label: 'Unresolved', value: unresolvedCount },
    ];
  }

  calculatePercentage(value: number): number {
    return this.totalTickets > 0
      ? Math.round((value / this.totalTickets) * 100)
      : 0;
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

  getProgressValue(value: number): string {
    const progress = (value / this.totalTickets) * 283;
    return `${progress}, 283`;
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

  createYearlyLineChart() {
    const yearCounts = d3.rollup(
      this.tickets,
      (v) => v.length,
      (d) => new Date(d.created).getFullYear()
    );

    const data = Array.from(yearCounts, ([year, count]) => ({ year, count }));

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };

    const containerWidth = this.yearlyChart.nativeElement.clientWidth;
    const containerHeight = this.yearlyChart.nativeElement.clientHeight;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = d3
      .select(this.yearlyChart.nativeElement)
      .append('svg')
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    svg
      .append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2 + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Yearly Ticket Trend');

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.year.toString()))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count)!])
      .nice()
      .range([height, 0]);

    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('class', 'x-axis-label')
      .attr('x', width / 2)
      .attr('y', margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Year');

    svg
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 20)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .text('Ticket Count');

    const line = d3
      .line<{ year: number; count: number }>()
      .x((d) => x(d.year.toString())! + x.bandwidth() / 2)
      .y((d) => y(d.count));

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    svg
      .selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => x(d.year.toString())! + x.bandwidth() / 2)
      .attr('cy', (d) => y(d.count))
      .attr('r', 5)
      .on('mouseover', (event, d: any) => {
        d3.select(event.currentTarget).attr('r', 7);
        svg
          .append('text')
          .attr('class', 'tooltip')
          .attr('x', x(d.year.toString())! + x.bandwidth() / 2)
          .attr('y', y(d.count) - 10)
          .attr('text-anchor', 'middle')
          .text(d.count);
      })
      .on('mouseout', (event, d) => {
        d3.select(event.currentTarget).attr('r', 5);
        svg.selectAll('.tooltip').remove();
      });
  }

  createMonthlyTrend2024Chart() {
    const filteredTickets = this.tickets.filter(
      (ticket) => new Date(ticket.created).getFullYear() === 2024
    );

    const monthCounts = d3.rollup(
      filteredTickets,
      (v) => v.length,
      (d) => new Date(d.created).getMonth()
    );

    const resolvedCounts = d3.rollup(
      filteredTickets.filter((ticket) => ticket.resolution === 'DONE'),
      (v) => v.length,
      (d) => new Date(d.created).getMonth()
    );

    const unresolvedCounts = d3.rollup(
      filteredTickets.filter((ticket) => ticket.resolution === 'UNRESOLVED'),
      (v) => v.length,
      (d) => new Date(d.created).getMonth()
    );

    const data = Array.from(monthCounts, ([month, count]) => ({
      month,
      count,
    }));

    const resolvedData = Array.from(resolvedCounts, ([month, count]) => ({
      month,
      count,
    }));

    const unresolvedData = Array.from(unresolvedCounts, ([month, count]) => ({
      month,
      count,
    }));

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const margin = { top: 40, right: 30, bottom: 40, left: 60 };
    const width =
      this.monthlyChart.nativeElement.clientWidth - margin.left - margin.right;
    const height =
      this.monthlyChart.nativeElement.clientHeight - margin.top - margin.bottom;

    d3.select(this.monthlyChart.nativeElement).selectAll('*').remove();

    const svg = d3
      .select(this.monthlyChart.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    svg
      .append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2 + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('2024 Monthly Ticket Trend');

    const x = d3.scaleBand().domain(months).range([0, width]).padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max([
          d3.max(data, (d) => d.count) || 0,
          d3.max(resolvedData, (d) => d.count) || 0,
          d3.max(unresolvedData, (d) => d.count) || 0,
        ])!,
      ])
      .nice()
      .range([height, 0]);

    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('class', 'x-axis-label')
      .attr('x', width / 2)
      .attr('y', margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Month');

    svg
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 20)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .text('Ticket Count');

    const line = d3
      .line<{ month: number; count: number }>()
      .x((d) => x(months[d.month])! + x.bandwidth() / 2)
      .y((d) => y(d.count));

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    svg
      .append('path')
      .datum(resolvedData)
      .attr('fill', 'none')
      .attr('stroke', 'green')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    svg
      .append('path')
      .datum(unresolvedData)
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    svg
      .selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => x(months[d.month])! + x.bandwidth() / 2)
      .attr('cy', (d) => y(d.count))
      .attr('r', 5)
      .on('mouseover', (event, d: any) => {
        d3.select(event.currentTarget).attr('r', 7);
        svg
          .append('text')
          .attr('class', 'tooltip')
          .attr('x', x(months[d.month])! + x.bandwidth() / 2)
          .attr('y', y(d.count) - 10)
          .attr('text-anchor', 'middle')
          .text(d.count);
      })
      .on('mouseout', (event, d) => {
        d3.select(event.currentTarget).attr('r', 5);
        svg.selectAll('.tooltip').remove();
      });

    svg
      .selectAll('.resolved-dot')
      .data(resolvedData)
      .enter()
      .append('circle')
      .attr('class', 'resolved-dot')
      .attr('cx', (d) => x(months[d.month])! + x.bandwidth() / 2)
      .attr('cy', (d) => y(d.count))
      .attr('r', 5)
      .attr('fill', 'green')
      .on('mouseover', (event, d: any) => {
        d3.select(event.currentTarget).attr('r', 7);
        svg
          .append('text')
          .attr('class', 'tooltip')
          .attr('x', x(months[d.month])! + x.bandwidth() / 2)
          .attr('y', y(d.count) - 10)
          .attr('text-anchor', 'middle')
          .text(d.count);
      })
      .on('mouseout', (event, d) => {
        d3.select(event.currentTarget).attr('r', 5);
        svg.selectAll('.tooltip').remove();
      });

    svg
      .selectAll('.unresolved-dot')
      .data(unresolvedData)
      .enter()
      .append('circle')
      .attr('class', 'unresolved-dot')
      .attr('cx', (d) => x(months[d.month])! + x.bandwidth() / 2)
      .attr('cy', (d) => y(d.count))
      .attr('r', 5)
      .attr('fill', 'red')
      .on('mouseover', (event, d: any) => {
        d3.select(event.currentTarget).attr('r', 7);
        svg
          .append('text')
          .attr('class', 'tooltip')
          .attr('x', x(months[d.month])! + x.bandwidth() / 2)
          .attr('y', y(d.count) - 10)
          .attr('text-anchor', 'middle')
          .text(d.count);
      })
      .on('mouseout', (event, d) => {
        d3.select(event.currentTarget).attr('r', 5);
        svg.selectAll('.tooltip').remove();
      });

    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 100}, 0)`);

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', 20)
      .style('fill', 'steelblue');

    legend.append('text').attr('x', 30).attr('y', 15).text('Total Tickets');

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 30)
      .attr('width', 20)
      .attr('height', 20)
      .style('fill', 'green');

    legend.append('text').attr('x', 30).attr('y', 45).text('Resolved Tickets');

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 60)
      .attr('width', 20)
      .attr('height', 20)
      .style('fill', 'red');

    legend
      .append('text')
      .attr('x', 30)
      .attr('y', 75)
      .text('Unresolved Tickets');
  }

  createAssigneeKPIChart() {
    const filteredTickets = this.tickets.filter(
      (ticket) => new Date(ticket.created).getFullYear() === 2024
    );

    const kpiThresholds = {
      highest: 60,
      high: 120,
      medium: 8 * 60,
      low: 2 * 24 * 60,
    };

    const assigneeKPI = d3.rollup(
      filteredTickets,
      (v) => {
        const withinKPI = v.filter((ticket) => {
          if (!ticket.priority) return false;

          const resolutionTime =
            (new Date(ticket.updated).getTime() -
              new Date(ticket.created).getTime()) /
            (1000 * 60);

          const threshold =
            kpiThresholds[
              ticket.priority.toLowerCase() as
                | 'highest'
                | 'high'
                | 'medium'
                | 'low'
            ];

          return threshold ? resolutionTime <= threshold : false;
        }).length;

        const outsideKPI = v.length - withinKPI;
        return { withinKPI, outsideKPI };
      },
      (d) => d.assignee
    );

    const data = Array.from(assigneeKPI, ([assignee, counts]) => ({
      assignee,
      withinKPI: counts.withinKPI,
      outsideKPI: counts.outsideKPI,
    }));

    const margin = { top: 40, right: 30, bottom: 40, left: 60 };
    const width =
      this.assigneeChart.nativeElement.clientWidth - margin.left - margin.right;
    const height =
      this.assigneeChart.nativeElement.clientHeight -
      margin.top -
      margin.bottom;

    d3.select(this.assigneeChart.nativeElement).selectAll('*').remove();

    const svg = d3
      .select(this.assigneeChart.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.assignee))
      .range([0, width])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.withinKPI + d.outsideKPI)!])
      .nice()
      .range([height, 0]);

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('margin-top', '20px')
      .text('Assignee wise Resolved within KPI and Unresolved tickets');

    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('class', 'x-axis-label')
      .attr('x', width / 2)
      .attr('y', margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .text('Assignee');

    svg
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 20)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .text('Ticket Count');

    const barGroups = svg
      .selectAll('.bar-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('transform', (d) => `translate(${x(d.assignee)},0)`);

    barGroups
      .append('rect')
      .attr('class', 'within-bar')
      .attr('x', 0)
      .attr('y', (d) => y(d.withinKPI))
      .attr('width', x.bandwidth() / 2)
      .attr('height', (d) => height - y(d.withinKPI))
      .attr('fill', 'green');

    barGroups
      .append('rect')
      .attr('class', 'outside-bar')
      .attr('x', x.bandwidth() / 2)
      .attr('y', (d) => y(d.outsideKPI))
      .attr('width', x.bandwidth() / 2)
      .attr('height', (d) => height - y(d.outsideKPI))
      .attr('fill', 'red');

    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, -30)`);

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', 'green');

    legend.append('text').attr('x', 30).attr('y', 15).text('Within KPI');

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 30)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', 'red');

    legend.append('text').attr('x', 30).attr('y', 45).text('Outside KPI');
  }

  createStackedBarChart(): void {
    const margin = { top: 40, right: 30, bottom: 40, left: 60 };
    const width =
      this.appNameChart.nativeElement.clientWidth - margin.left - margin.right;
    const height =
      this.appNameChart.nativeElement.clientHeight - margin.top - margin.bottom;

    d3.select(this.appNameChart.nativeElement).selectAll('*').remove();

    const svg = d3
      .select(this.appNameChart.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const issueTypes = [
      'SERVICE_REQUEST',
      'CHANGE_REQUEST',
      'USER_ACCESS',
      'FAULT',
    ];

    const stackedBarData = Array.from(
      d3.group(this.tickets, (d: any) => d.appName),
      ([appName, tickets]) => {
        const counts: any = { appName };
        issueTypes.forEach((type) => {
          counts[type] = tickets.filter(
            (ticket) => ticket.issueType === type
          ).length;
        });
        return counts;
      }
    );

    const x = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(stackedBarData, (d: any) =>
          issueTypes.reduce((sum, type) => sum + d[type], 0)
        )!,
      ])
      .range([0, width]);

    const y = d3
      .scaleBand()
      .domain(stackedBarData.map((d: any) => d.appName))
      .range([0, height])
      .padding(0.5);

    const color = d3
      .scaleOrdinal<string>()
      .domain(issueTypes)
      .range(['#d32f2f', '#f57c00', '#1976d2', '#388e3c']);

    const stackData = d3.stack().keys(issueTypes)(stackedBarData);

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('margin-top', '20px')
      .text('Application-wise Issue Types');

    const barGroups = svg
      .selectAll('.bar-group')
      .data(stackData)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('fill', (d) => color(d.key));

    barGroups
      .selectAll('rect')
      .data((d) => d)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d: any) => y(d.data['appName'])!)
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d[1]) - x(d[0]));

    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g').attr('class', 'y-axis').call(d3.axisLeft(y));

    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, -30)`);

    issueTypes.forEach((type, index) => {
      legend
        .append('rect')
        .attr('x', 0)
        .attr('y', index * 20)
        .attr('width', 20)
        .attr('height', 20)
        .attr('fill', color(type));

      legend
        .append('text')
        .attr('x', 30)
        .attr('y', index * 20 + 15)
        .text(type);
    });

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
            `App: ${d.data.appName}<br/>
            SERVICE_REQUEST: ${d.data.SERVICE_REQUEST}<br/>
            CHANGE_REQUEST: ${d.data.CHANGE_REQUEST}<br/>
            USER_ACCESS: ${d.data.USER_ACCESS}<br/>
            FAULT: ${d.data.FAULT}`
          )
          .style('left', `${event.pageX}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });
  }
}
