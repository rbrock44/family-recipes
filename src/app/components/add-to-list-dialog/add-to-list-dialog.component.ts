import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Recipe } from 'src/app/models/recipe.interface';
import { RecipeList } from 'src/app/models/recipe-list.interface';
import { RecipeService } from 'src/app/services/recipe.service';

export interface AddToListDialogData {
  recipes: Recipe[];
  defaultBatches: number;
}

const NEW_LIST_VALUE = 'new';

@Component({
  selector: 'app-add-to-list-dialog',
  templateUrl: './add-to-list-dialog.component.html',
  styleUrls: ['./add-to-list-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AddToListDialogComponent {
  lists: RecipeList[] = this.service.readLists();
  selectedListControl = new FormControl<string>(
    this.lists.length > 0 ? this.lists[0].id : NEW_LIST_VALUE,
  );
  newListNameControl = new FormControl('', [Validators.required]);

  constructor(
    public dialogRef: MatDialogRef<AddToListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddToListDialogData,
    private service: RecipeService,
  ) {}

  get isCreatingNew(): boolean {
    return this.selectedListControl.value === NEW_LIST_VALUE;
  }

  get canConfirm(): boolean {
    return this.isCreatingNew
      ? !!this.newListNameControl.value?.trim()
      : !!this.selectedListControl.value;
  }

  confirm(): void {
    if (!this.canConfirm) {
      return;
    }

    let listId = this.selectedListControl.value as string;

    if (this.isCreatingNew) {
      const name = (this.newListNameControl.value || '').trim();
      const list = this.service.createList(name);
      listId = list.id;
    }

    this.data.recipes.forEach((recipe) => {
      this.service.addToList(listId, recipe.filename, this.data.defaultBatches);
    });

    this.dialogRef.close(listId);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
