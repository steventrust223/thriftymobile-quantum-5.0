/**
 * Device and condition type definitions
 */

export enum DeviceGrade {
  GRADE_A = 'A',
  GRADE_B_PLUS = 'B+',
  GRADE_B = 'B',
  GRADE_C = 'C',
  GRADE_D = 'D',
  DOA = 'DOA'
}

export enum DeviceCondition {
  MINT = 'Mint',
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
  BROKEN = 'Broken',
  FOR_PARTS = 'For Parts'
}

export enum Carrier {
  UNLOCKED = 'Unlocked',
  VERIZON = 'Verizon',
  ATT = 'AT&T',
  TMOBILE = 'T-Mobile',
  SPRINT = 'Sprint',
  CRICKET = 'Cricket',
  METRO = 'Metro',
  BOOST = 'Boost',
  UNKNOWN = 'Unknown'
}

export interface DeviceIssue {
  type: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  deduction: number;
  autoReject?: boolean;
}

export interface Device {
  brand: string;
  model: string;
  storage: string;
  color?: string;
  carrier: Carrier;
  condition: DeviceCondition;
  estimatedGrade: DeviceGrade;
  issues: DeviceIssue[];
  isDemo?: boolean;
  isBlacklisted?: boolean;
  iCloudLocked?: boolean;
}

export const DEVICE_ISSUES: Record<string, DeviceIssue> = {
  CRACKED_BACK: {
    type: 'Cracked Back Glass',
    severity: 'major',
    deduction: 180
  },
  CRACKED_SCREEN: {
    type: 'Cracked Screen',
    severity: 'major',
    deduction: 90
  },
  CRICKET_DEVICE: {
    type: 'Cricket Locked Device',
    severity: 'moderate',
    deduction: 100
  },
  DEMO_UNIT: {
    type: 'Demo/Display Unit',
    severity: 'moderate',
    deduction: 70
  },
  BLACKLISTED: {
    type: 'Blacklisted/Blocked IMEI',
    severity: 'critical',
    deduction: 0,
    autoReject: true
  },
  ICLOUD_LOCKED: {
    type: 'iCloud Activation Lock',
    severity: 'critical',
    deduction: 0,
    autoReject: true
  },
  BATTERY_DEGRADED: {
    type: 'Battery Health <80%',
    severity: 'minor',
    deduction: 30
  },
  SCRATCHES_MINOR: {
    type: 'Minor Scratches',
    severity: 'minor',
    deduction: 15
  },
  SCRATCHES_MODERATE: {
    type: 'Moderate Scratches',
    severity: 'moderate',
    deduction: 40
  },
  DENTS: {
    type: 'Dents/Dings',
    severity: 'moderate',
    deduction: 35
  },
  WATER_DAMAGE: {
    type: 'Water Damage',
    severity: 'critical',
    deduction: 150
  },
  FACE_ID_BROKEN: {
    type: 'Face ID Not Working',
    severity: 'major',
    deduction: 80
  },
  CAMERA_BROKEN: {
    type: 'Camera Not Working',
    severity: 'major',
    deduction: 60
  },
  BUTTON_BROKEN: {
    type: 'Button Not Working',
    severity: 'moderate',
    deduction: 40
  },
  SPEAKER_BROKEN: {
    type: 'Speaker Not Working',
    severity: 'moderate',
    deduction: 50
  }
};
