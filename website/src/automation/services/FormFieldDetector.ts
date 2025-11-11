/**
 * Form Field Detector
 * 
 * Intelligently detects form fields on a page by analyzing HTML structure,
 * input types, labels, and placeholders.
 */

import { Page, Locator } from 'playwright';
import { DetectedField } from './FormFieldMapper';

export class FormFieldDetector {
  /**
   * Detect all form fields on the page
   */
  async detectFields(page: Page): Promise<DetectedField[]> {
    const fields: DetectedField[] = [];

    // Detect input fields
    const inputFields = await this.detectInputFields(page);
    fields.push(...inputFields);

    // Detect select fields
    const selectFields = await this.detectSelectFields(page);
    fields.push(...selectFields);

    // Detect textarea fields
    const textareaFields = await this.detectTextareaFields(page);
    fields.push(...textareaFields);

    // Detect checkbox and radio fields
    const checkboxFields = await this.detectCheckboxFields(page);
    fields.push(...checkboxFields);

    console.log(`[FormFieldDetector] Detected ${fields.length} form fields`);

    return fields;
  }

  /**
   * Detect input fields
   */
  private async detectInputFields(page: Page): Promise<DetectedField[]> {
    const fields: DetectedField[] = [];
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="number"], input:not([type])').all();

    for (const input of inputs) {
      try {
        const type = await this.getInputType(input);
        const name = await this.getFieldName(input);
        const selector = await this.getSelector(input);
        const label = await this.getLabel(input);
        const placeholder = await this.getPlaceholder(input);
        const required = await this.isRequired(input);

        if (name || label || placeholder) {
          fields.push({
            name: name || label || placeholder || 'unknown',
            selector,
            type,
            label,
            placeholder,
            required
          });
        }
      } catch (error) {
        // Skip fields that can't be processed
        continue;
      }
    }

    return fields;
  }

  /**
   * Detect select fields
   */
  private async detectSelectFields(page: Page): Promise<DetectedField[]> {
    const fields: DetectedField[] = [];
    const selects = await page.locator('select').all();

    for (const select of selects) {
      try {
        const name = await this.getFieldName(select);
        const selector = await this.getSelector(select);
        const label = await this.getLabel(select);
        const required = await this.isRequired(select);

        if (name || label) {
          fields.push({
            name: name || label || 'unknown',
            selector,
            type: 'select',
            label,
            required
          });
        }
      } catch (error) {
        continue;
      }
    }

    return fields;
  }

  /**
   * Detect textarea fields
   */
  private async detectTextareaFields(page: Page): Promise<DetectedField[]> {
    const fields: DetectedField[] = [];
    const textareas = await page.locator('textarea').all();

    for (const textarea of textareas) {
      try {
        const name = await this.getFieldName(textarea);
        const selector = await this.getSelector(textarea);
        const label = await this.getLabel(textarea);
        const placeholder = await this.getPlaceholder(textarea);
        const required = await this.isRequired(textarea);

        if (name || label || placeholder) {
          fields.push({
            name: name || label || placeholder || 'unknown',
            selector,
            type: 'textarea',
            label,
            placeholder,
            required
          });
        }
      } catch (error) {
        continue;
      }
    }

    return fields;
  }

  /**
   * Detect checkbox and radio fields
   */
  private async detectCheckboxFields(page: Page): Promise<DetectedField[]> {
    const fields: DetectedField[] = [];
    const checkboxes = await page.locator('input[type="checkbox"], input[type="radio"]').all();

    for (const checkbox of checkboxes) {
      try {
        const type = await checkbox.getAttribute('type') as 'checkbox' | 'radio';
        const name = await this.getFieldName(checkbox);
        const selector = await this.getSelector(checkbox);
        const label = await this.getLabel(checkbox);
        const required = await this.isRequired(checkbox);

        if (name || label) {
          fields.push({
            name: name || label || 'unknown',
            selector,
            type,
            label,
            required
          });
        }
      } catch (error) {
        continue;
      }
    }

    return fields;
  }

  /**
   * Get input type
   */
  private async getInputType(input: Locator): Promise<DetectedField['type']> {
    const type = await input.getAttribute('type');
    
    switch (type) {
      case 'email':
        return 'email';
      case 'tel':
        return 'tel';
      case 'date':
        return 'date';
      case 'number':
        return 'number';
      default:
        // Check if it looks like an email field
        const name = await input.getAttribute('name') || '';
        const placeholder = await input.getAttribute('placeholder') || '';
        if (name.toLowerCase().includes('email') || placeholder.toLowerCase().includes('email')) {
          return 'email';
        }
        // Check if it looks like a phone field
        if (name.toLowerCase().includes('phone') || placeholder.toLowerCase().includes('phone')) {
          return 'tel';
        }
        return 'text';
    }
  }

  /**
   * Get field name from various attributes
   */
  private async getFieldName(element: Locator): Promise<string | null> {
    // Try name attribute
    const name = await element.getAttribute('name');
    if (name) return name;

    // Try id attribute
    const id = await element.getAttribute('id');
    if (id) return id;

    // Try data attributes
    const dataName = await element.getAttribute('data-name');
    if (dataName) return dataName;

    return null;
  }

  /**
   * Get CSS selector for element
   */
  private async getSelector(element: Locator): Promise<string> {
    // Try to get a unique selector
    const name = await element.getAttribute('name');
    if (name) {
      return `input[name="${name}"], select[name="${name}"], textarea[name="${name}"]`;
    }

    const id = await element.getAttribute('id');
    if (id) {
      return `#${id}`;
    }

    // Fallback to a more complex selector
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const index = await element.evaluate(el => {
      const parent = el.parentElement;
      if (!parent) return -1;
      return Array.from(parent.children).indexOf(el);
    });

    if (index >= 0) {
      return `${tagName}:nth-of-type(${index + 1})`;
    }

    return tagName;
  }

  /**
   * Get label associated with field
   */
  private async getLabel(element: Locator): Promise<string | null> {
    // Try for attribute on label
    const id = await element.getAttribute('id');
    if (id) {
      const label = await element.page().locator(`label[for="${id}"]`).textContent().catch(() => null);
      if (label) return label.trim();
    }

    // Try aria-label
    const ariaLabel = await element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();

    // Try finding label as parent or sibling
    try {
      // Check if element is inside a label
      const parentLabelText = await element.evaluate(el => {
        const label = el.closest('label');
        return label?.textContent?.trim() || null;
      });
      if (parentLabelText) return parentLabelText;

      // Check for preceding label sibling
      const previousLabelText = await element.evaluate(el => {
        let prev = el.previousElementSibling;
        while (prev) {
          if (prev.tagName === 'LABEL') {
            return prev.textContent?.trim() || null;
          }
          prev = prev.previousElementSibling;
        }
        return null;
      });
      if (previousLabelText) return previousLabelText;
    } catch (error) {
      // Ignore errors in label detection
    }

    return null;
  }

  /**
   * Get placeholder text
   */
  private async getPlaceholder(element: Locator): Promise<string | null> {
    const placeholder = await element.getAttribute('placeholder');
    return placeholder ? placeholder.trim() : null;
  }

  /**
   * Check if field is required
   */
  private async isRequired(element: Locator): Promise<boolean> {
    const required = await element.getAttribute('required');
    if (required !== null) return true;

    const ariaRequired = await element.getAttribute('aria-required');
    if (ariaRequired === 'true') return true;

    // Check for required class or indicator
    const classes = await element.getAttribute('class') || '';
    if (classes.includes('required')) return true;

    return false;
  }
}

