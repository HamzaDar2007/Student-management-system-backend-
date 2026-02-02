import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExtendedFieldsToStudents1738396800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 13 new columns to students table
    await queryRunner.addColumns('students', [
      new TableColumn({
        name: 'blood_group',
        type: 'varchar',
        length: '10',
        isNullable: true,
      }),
      new TableColumn({
        name: 'nationality',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'emergency_contact_name',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'emergency_contact_phone',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
      new TableColumn({
        name: 'emergency_contact_relationship',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'guardian_name',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'guardian_phone',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
      new TableColumn({
        name: 'guardian_email',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'guardian_relationship',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'medical_conditions',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'allergies',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'current_year',
        type: 'integer',
        isNullable: true,
        comment: 'Current academic year: 1-4 (Freshman to Senior)',
      }),
      new TableColumn({
        name: 'current_semester',
        type: 'integer',
        isNullable: true,
        comment: 'Current semester within the academic year: 1-2 (Fall/Spring)',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the columns if migration is rolled back
    await queryRunner.dropColumns('students', [
      'blood_group',
      'nationality',
      'emergency_contact_name',
      'emergency_contact_phone',
      'emergency_contact_relationship',
      'guardian_name',
      'guardian_phone',
      'guardian_email',
      'guardian_relationship',
      'medical_conditions',
      'allergies',
      'current_year',
      'current_semester',
    ]);
  }
}
