import { Injectable } from '@angular/core';
import { Ticket } from '../models/ticket';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private apiUrl = 'http://localhost:8080/api/getAllTickets';
  private tickets: Ticket[] = [];

  constructor(private http: HttpClient) {}

  fetchTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl);
  }

  loadTickets(): Observable<Ticket[]> {
    return this.fetchTickets().pipe(
      tap((data: Ticket[]) => {
        this.tickets = data.map((ticket) => new Ticket(ticket));
      })
    );
  }

  getAllTickets(): Ticket[] {
    return this.tickets;
  }
}
