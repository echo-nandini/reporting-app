import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  createUser(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/createUser`, user);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  getUserId(): number | null {
    const user = JSON.parse(localStorage.getItem('user')!);
    return user ? user.id : null;
  }

  getUsername(): string | null {
    const user = JSON.parse(localStorage.getItem('user')!);
    return user ? user.username : null;
  }

  getRole(): string | null {
    const user = JSON.parse(localStorage.getItem('user')!);
    return user ? user.role : null;
  }
}
