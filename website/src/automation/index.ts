/**
 * Warranty Registration Automation - Public API
 *
 * Main entry point for the automation system.
 * Use this to execute warranty registrations programmatically.
 */

export { BaseAutomation } from './core/BaseAutomation';
export type {
  RegistrationData,
  AutomationResult,
  AutomationOptions
} from './core/BaseAutomation';

export { AutomationOrchestrator } from './services/AutomationOrchestrator';
export type {
  OrchestratorOptions,
  RegistrationRequest
} from './services/AutomationOrchestrator';

export { ManufacturerRegistry } from './manufacturers';

export {
  SamsungAutomation,
  AppleAutomation,
  GenericAutomation
} from './manufacturers';

// Manufacturer Detection Service
export { ManufacturerDetector } from './services/ManufacturerDetector';
export type {
  ManufacturerDetection,
  ManufacturerUsageStats
} from './services/ManufacturerDetector';

// Mobile Automation Support
export { MobileAutomationAdapter } from './core/MobileAutomationAdapter';
export type { MobileConfig } from './core/MobileAutomationAdapter';

// Form Automation Services
export { FormAutomationService } from './services/FormAutomationService';
export type {
  FormAutomationOptions,
  FormFieldMapping,
  FormAutomationResult
} from './services/FormAutomationService';

export { FormFieldMapper } from './services/FormFieldMapper';
export type { DetectedField } from './services/FormFieldMapper';

export { FormFieldDetector } from './services/FormFieldDetector';

// Form Mappings Configuration
export { getFormMappings, getAvailableMappings, FORM_MAPPINGS } from './config/form-mappings';

// Convenience function for simple use cases
export async function executeWarrantyRegistration(
  manufacturer: string,
  registrationData: RegistrationData,
  options?: OrchestratorOptions
): Promise<AutomationResult> {
  const orchestrator = new AutomationOrchestrator(options);

  try {
    return await orchestrator.executeRegistration(manufacturer, registrationData);
  } finally {
    await orchestrator.shutdown();
  }
}

// Re-export types for convenience
import type { RegistrationData, AutomationResult, OrchestratorOptions } from './core/BaseAutomation';
export type { RegistrationData as WarrantyData };
export type { AutomationResult as RegistrationResult };
