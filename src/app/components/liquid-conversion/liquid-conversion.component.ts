import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { LIQUID_CONVERSIONS } from 'src/app/constants/constants';
import { LiquidConversion } from 'src/app/models/liquid-conversion.model';

@Component({
  selector: 'app-liquid-conversion',
  templateUrl: './liquid-conversion.component.html',
  styleUrls: ['./liquid-conversion.component.scss']
})
export class LiquidConversionComponent {
  dataSource = new MatTableDataSource<LiquidConversion>(LIQUID_CONVERSIONS);
  displayColumns: string[] = ['gallons', 'cups', 'quarts', 'pints'];
}
