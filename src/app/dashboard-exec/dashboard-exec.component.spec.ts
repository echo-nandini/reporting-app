import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardExecComponent } from './dashboard-exec.component';

describe('DashboardExecComponent', () => {
  let component: DashboardExecComponent;
  let fixture: ComponentFixture<DashboardExecComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardExecComponent]
    });
    fixture = TestBed.createComponent(DashboardExecComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
