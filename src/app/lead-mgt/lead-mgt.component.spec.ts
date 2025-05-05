import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadMgtComponent } from './lead-mgt.component';

describe('LeadMgtComponent', () => {
  let component: LeadMgtComponent;
  let fixture: ComponentFixture<LeadMgtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadMgtComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeadMgtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
