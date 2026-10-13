import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { Mock } from 'vitest';
import { EMPTY_RECIPE } from '../../constants/constants';
import { Recipe } from '../../models/recipe.interface';
import { RecipeList } from '../../models/recipe-list.interface';
import { RecipeService } from '../../services/recipe.service';
import { AddToListDialogComponent, AddToListDialogData } from './add-to-list-dialog.component';

function recipe(filename: string): Recipe {
  return { ...EMPTY_RECIPE, filename, name: `Recipe ${filename}` };
}

describe('AddToListDialogComponent', () => {
  let fixture: ComponentFixture<AddToListDialogComponent>;
  let component: AddToListDialogComponent;
  let lists: RecipeList[];
  let service: { readLists: () => RecipeList[]; createList: Mock; addToList: Mock };
  let dialogRef: { close: Mock };

  function create(data: AddToListDialogData): void {
    TestBed.configureTestingModule({
      imports: [AddToListDialogComponent],
      providers: [
        { provide: RecipeService, useValue: service },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(AddToListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const title = () => fixture.nativeElement.querySelector('h2').textContent.replace(/\s+/g, ' ').trim();

  beforeEach(() => {
    lists = [
      { id: 'list-1', name: 'Weekend', recipes: [] },
      { id: 'list-2', name: 'Holidays', recipes: [] },
    ];
    service = {
      readLists: () => lists,
      createList: vi.fn((name: string) => ({ id: 'list-new', name, recipes: [] })),
      addToList: vi.fn(),
    };
    dialogRef = { close: vi.fn() };
  });

  it('selects the first list and titles itself by recipe count', () => {
    create({ recipes: [recipe('0001')], defaultBatches: 1 });

    expect(component.selectedListControl.value).toBe('list-1');
    expect(component.isCreatingNew).toBe(false);
    expect(title()).toBe('Add 1 Recipe to List');
  });

  it('starts on a new list when there are none', () => {
    lists = [];
    create({ recipes: [recipe('0001'), recipe('0002')], defaultBatches: 1 });

    expect(component.isCreatingNew).toBe(true);
    expect(component.canConfirm).toBe(false);
    expect(title()).toBe('Add 2 Recipes to List');
  });

  it('adds every recipe to the chosen list with the default batches', () => {
    create({ recipes: [recipe('0001'), recipe('0002')], defaultBatches: 3 });
    component.selectedListControl.setValue('list-2');

    component.confirm();

    expect(service.addToList.mock.calls).toEqual([
      ['list-2', '0001', 3],
      ['list-2', '0002', 3],
    ]);
    expect(service.createList).not.toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith('list-2');
  });

  it('creates a new list with the trimmed name', () => {
    create({ recipes: [recipe('0001')], defaultBatches: 1 });
    component.selectedListControl.setValue('new');
    component.newListNameControl.setValue('  Taco Night ');

    component.confirm();

    expect(service.createList).toHaveBeenCalledWith('Taco Night');
    expect(service.addToList).toHaveBeenCalledWith('list-new', '0001', 1);
    expect(dialogRef.close).toHaveBeenCalledWith('list-new');
  });

  it('will not confirm a new list without a name', () => {
    create({ recipes: [recipe('0001')], defaultBatches: 1 });
    component.selectedListControl.setValue('new');
    component.newListNameControl.setValue('   ');

    component.confirm();

    expect(service.createList).not.toHaveBeenCalled();
    expect(service.addToList).not.toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('closes with no result on cancel', () => {
    create({ recipes: [recipe('0001')], defaultBatches: 1 });

    component.cancel();

    expect(dialogRef.close).toHaveBeenCalledWith();
    expect(service.addToList).not.toHaveBeenCalled();
  });
});
