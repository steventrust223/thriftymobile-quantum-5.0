/**
 * Grading Engine - Evaluates device condition and assigns grades
 */

import { DeviceGrade, DeviceCondition, DeviceIssue, DEVICE_ISSUES, Device } from '../types/Device';

export class GradingEngine {
  /**
   * Grade a device based on condition and issues
   */
  public static gradeDevice(device: Device): {
    grade: DeviceGrade;
    totalDeductions: number;
    issues: DeviceIssue[];
    autoReject: boolean;
  } {
    const issues: DeviceIssue[] = [];
    let totalDeductions = 0;
    let autoReject = false;

    // Check for auto-reject conditions
    if (device.isBlacklisted) {
      issues.push(DEVICE_ISSUES.BLACKLISTED);
      autoReject = true;
      return { grade: DeviceGrade.DOA, totalDeductions: 0, issues, autoReject };
    }

    if (device.iCloudLocked) {
      issues.push(DEVICE_ISSUES.ICLOUD_LOCKED);
      autoReject = true;
      return { grade: DeviceGrade.DOA, totalDeductions: 0, issues, autoReject };
    }

    // Apply deductions based on detected issues
    for (const issue of device.issues) {
      const issueDetail = this.getIssueDetail(issue.type);
      if (issueDetail) {
        issues.push(issueDetail);
        totalDeductions += issueDetail.deduction;

        if (issueDetail.autoReject) {
          autoReject = true;
        }
      }
    }

    // Apply carrier-specific deductions
    if (device.carrier === 'Cricket') {
      issues.push(DEVICE_ISSUES.CRICKET_DEVICE);
      totalDeductions += DEVICE_ISSUES.CRICKET_DEVICE.deduction;
    }

    // Apply demo unit deduction
    if (device.isDemo) {
      issues.push(DEVICE_ISSUES.DEMO_UNIT);
      totalDeductions += DEVICE_ISSUES.DEMO_UNIT.deduction;
    }

    // Determine grade based on condition and total deductions
    const grade = this.calculateGrade(device.condition, totalDeductions);

    return { grade, totalDeductions, issues, autoReject };
  }

  /**
   * Calculate grade based on condition and deductions
   */
  private static calculateGrade(condition: DeviceCondition, deductions: number): DeviceGrade {
    // Start with condition-based grade
    let baseGrade: DeviceGrade;

    switch (condition) {
      case DeviceCondition.MINT:
        baseGrade = DeviceGrade.GRADE_A;
        break;
      case DeviceCondition.EXCELLENT:
        baseGrade = DeviceGrade.GRADE_B_PLUS;
        break;
      case DeviceCondition.GOOD:
        baseGrade = DeviceGrade.GRADE_B;
        break;
      case DeviceCondition.FAIR:
        baseGrade = DeviceGrade.GRADE_C;
        break;
      case DeviceCondition.POOR:
        baseGrade = DeviceGrade.GRADE_D;
        break;
      default:
        baseGrade = DeviceGrade.GRADE_C;
    }

    // Adjust grade based on deductions
    if (deductions >= 300) return DeviceGrade.DOA;
    if (deductions >= 200) return DeviceGrade.GRADE_D;
    if (deductions >= 150) return DeviceGrade.GRADE_C;
    if (deductions >= 100) return this.downgradeOne(baseGrade);
    if (deductions >= 50) return this.downgradeOne(baseGrade, false);

    return baseGrade;
  }

  /**
   * Downgrade by one level
   */
  private static downgradeOne(grade: DeviceGrade, aggressive = true): DeviceGrade {
    const gradeOrder = [
      DeviceGrade.GRADE_A,
      DeviceGrade.GRADE_B_PLUS,
      DeviceGrade.GRADE_B,
      DeviceGrade.GRADE_C,
      DeviceGrade.GRADE_D,
      DeviceGrade.DOA
    ];

    const currentIndex = gradeOrder.indexOf(grade);
    const downgradeSteps = aggressive ? 2 : 1;
    const newIndex = Math.min(currentIndex + downgradeSteps, gradeOrder.length - 1);

    return gradeOrder[newIndex];
  }

  /**
   * Get issue detail by type
   */
  private static getIssueDetail(issueType: string): DeviceIssue | undefined {
    // Match issue type to known issues
    const normalized = issueType.toLowerCase().replace(/\s+/g, '_').toUpperCase();

    for (const [key, issue] of Object.entries(DEVICE_ISSUES)) {
      if (key === normalized || issue.type.toLowerCase() === issueType.toLowerCase()) {
        return issue;
      }
    }

    // Create custom issue if not found
    if (issueType) {
      return {
        type: issueType,
        severity: 'moderate',
        deduction: 25
      };
    }

    return undefined;
  }

  /**
   * Get partner buyback price for a device
   */
  public static getPartnerBuybackPrice(
    brand: string,
    model: string,
    storage: string,
    grade: DeviceGrade
  ): number {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Buyback Matrix');
      if (!sheet) {
        Logger.log('Warning: Buyback Matrix sheet not found');
        return 0;
      }

      const data = sheet.getDataRange().getValues();

      // Find matching row
      for (let i = 1; i < data.length; i++) {
        const rowBrand = data[i][0];
        const rowModel = data[i][1];
        const rowStorage = data[i][2];

        if (
          rowBrand?.toString().toLowerCase() === brand.toLowerCase() &&
          rowModel?.toString().toLowerCase() === model.toLowerCase() &&
          rowStorage?.toString().toLowerCase() === storage.toLowerCase()
        ) {
          // Get price based on grade
          const gradeColumn = this.getGradeColumn(grade);
          const price = data[i][gradeColumn];

          return typeof price === 'number' ? price : parseFloat(price?.toString() || '0');
        }
      }

      Logger.log(`No buyback price found for ${brand} ${model} ${storage} ${grade}`);
      return 0;
    } catch (error) {
      Logger.log(`Error getting buyback price: ${error}`);
      return 0;
    }
  }

  /**
   * Get column index for grade
   */
  private static getGradeColumn(grade: DeviceGrade): number {
    // Columns: Brand(0), Model(1), Storage(2), A(3), B+(4), B(5), C(6), D(7)
    switch (grade) {
      case DeviceGrade.GRADE_A:
        return 3;
      case DeviceGrade.GRADE_B_PLUS:
        return 4;
      case DeviceGrade.GRADE_B:
        return 5;
      case DeviceGrade.GRADE_C:
        return 6;
      case DeviceGrade.GRADE_D:
        return 7;
      default:
        return 5; // Default to Grade B
    }
  }

  /**
   * Suggest inspection checklist for a device
   */
  public static getInspectionChecklist(device: Device): string[] {
    const checklist: string[] = [
      'Verify IMEI is not blacklisted',
      'Check iCloud/FMI status',
      'Test all buttons (power, volume)',
      'Test touch screen responsiveness',
      'Check for screen cracks/damage',
      'Check for back glass cracks',
      'Test Face ID / Touch ID',
      'Test all cameras (front and back)',
      'Test speakers and microphone',
      'Check battery health percentage',
      'Verify storage capacity',
      'Check for water damage indicators',
      'Test charging port',
      'Verify carrier unlock status'
    ];

    // Add device-specific checks
    if (device.brand === 'Apple') {
      checklist.push('Verify original Apple parts (no third-party screens)');
    }

    if (device.issues.length > 0) {
      checklist.push(`Verify reported issues: ${device.issues.map(i => i.type).join(', ')}`);
    }

    return checklist;
  }
}
