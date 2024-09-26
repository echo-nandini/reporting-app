import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

enum NotificationType {
  Success = 'success',
  Failure = 'failure',
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  showNotification(message: string, type: 'success' | 'error') {
    const config: MatSnackBarConfig = {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'right',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
    };

    this.snackBar.open(message, 'Close', config);
  }
}
