import {By} from '@angular/platform-browser';
import {ComponentFixture} from '@angular/core/testing';

export function expectElementToContainContent(
  fixture: ComponentFixture<any>,
  cssSelector: string,
  content: string
) {
  expectElementPresent(fixture, cssSelector);
  const element = fixture.debugElement.query(By.css(cssSelector));
  const value = element.nativeElement.textContent;
  expect(value.indexOf(content) >= 0).toBeTruthy(`${cssSelector} did not contain ${content}`);
}

export function expectElementToContainContentAtIndex(
  fixture: ComponentFixture<any>,
  cssSelector: string,
  content: string,
  index: number
) {
  expectElementPresent(fixture, cssSelector, `Element (${cssSelector}) cannot contain content if not present`);
  const element = fixture.debugElement.queryAll(By.css(cssSelector));
  const value = element[index].nativeElement.textContent;
  expect(value.indexOf(content) >= 0).toBeTruthy(`${cssSelector} did not contain ${content} at ${index}`);
}

export function expectElementPresent(
  fixture: ComponentFixture<any>,
  cssSelector: string,
  failMessage: string = `Element by this selector: ${cssSelector} does not exist`
) {
  const element = fixture.debugElement.query(By.css(cssSelector));
  expect(element).toBeTruthy(failMessage);
}

export function expectElementDisabled(
  fixture: ComponentFixture<any>,
  cssSelector: string,
  failMessage: string = `Element by this selector: ${cssSelector} does not disabled`
) {
  const element = fixture.debugElement.query(By.css(cssSelector));
  expect(element.properties['disabled']).toBeTruthy(failMessage);
}

export function expectElementPresentAtIndex(
  fixture: ComponentFixture<any>,
  cssSelector: string,
  index: number,
  failMessage: string = `Element by this selector: ${cssSelector} does not exist`
) {
  const element = fixture.debugElement.queryAll(By.css(cssSelector));
  expect(element[index]).toBeTruthy(failMessage);
}

export function expectElementAbsent(
  fixture: ComponentFixture<any>,
  cssSelector: string,
  failMessage: string = `Element by this selector: ${cssSelector} does exist`
) {
  const element = fixture.debugElement.query(By.css(cssSelector));
  expect(element).toBeFalsy(failMessage);
}

export function clickElement(
  fixture: ComponentFixture<any>,
  cssSelector: string,
) {
  expectElementPresent(fixture, cssSelector, `Element by this selector: ${cssSelector} does not exist but should to click`);
  // const element = fixture.debugElement.nativeElement.querySelector(cssSelector);
  const element = fixture.debugElement.query(By.css(cssSelector));
  element.triggerEventHandler('click', null);
  // element.click();
}

export function clickElementAtIndex(
  fixture: ComponentFixture<any>,
  cssSelector: string,
  index: number
) {
  expectElementPresent(fixture, cssSelector, `Element by this selector: ${cssSelector} does not exist but should to click at ${index}`);
  // const element = fixture.debugElement.nativeElement.querySelector(cssSelector);
  const element = fixture.debugElement.queryAll(By.css(cssSelector));
  element[index].triggerEventHandler('click', null);
  // element.click();
}

export function verifyDropdownOptions(fixture: ComponentFixture<any>, options: any[], values: string[], index = 0) {
  const element = fixture.debugElement.queryAll(By.css('mat-select'))[index];
  element.triggerEventHandler('click', null);
  fixture.detectChanges();
  options.forEach((value, ind) => {
    // const element = fixture.debugElement.queryAll(By.css('mat-form-field'));
    expectElementToContainContentAtIndex(fixture, 'mat-option', values[index], ind);
  });
}

export function expectHeaderText(fixture: ComponentFixture<any>, columns: string[]) {
  columns.forEach((col, index) => {
    expectElementToContainContentAtIndex(fixture, 'mat-header-cell', col, index);
  });
}
