import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { DRY_CONVERSIONS } from 'src/app/constants/constants';
import { DryConversion } from 'src/app/models/dry-conversion.model';

@Component({
  selector: 'app-dry-conversion',
  templateUrl: './dry-conversion.component.html',
  styleUrls: ['./dry-conversion.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class DryConversionComponent {
  dataSource = new MatTableDataSource<DryConversion>(DRY_CONVERSIONS);
  displayColumns: string[] = ['cups', 'tablespoons', 'teaspoons', 'grams'];
}
