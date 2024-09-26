import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css'],
})
export class CreateUserComponent {
  createUserForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.createUserForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      role: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.createUserForm.valid) {
      this.authService.createUser(this.createUserForm.value).subscribe(
        (response) => {
          console.log('User created:', response);
          this.router.navigate(['/login']);
        },
        (error) => {
          console.error('User creation failed:', error);
        }
      );
    }
  }
}
