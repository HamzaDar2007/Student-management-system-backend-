import 'reflect-metadata';
import { Roles, ROLES_KEY } from './roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';

describe('Roles Decorator', () => {
  it('should be defined', () => {
    expect(Roles).toBeDefined();
  });

  it('should export ROLES_KEY constant', () => {
    expect(ROLES_KEY).toBe('roles');
  });

  describe('Single Role', () => {
    it('should set ADMIN role metadata on a method', () => {
      class TestController {
        @Roles(UserRole.ADMIN)
        adminMethod() {}
      }

      const metadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.adminMethod,
      );

      expect(metadata).toEqual([UserRole.ADMIN]);
    });

    it('should set TEACHER role metadata on a method', () => {
      class TestController {
        @Roles(UserRole.TEACHER)
        teacherMethod() {}
      }

      const metadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.teacherMethod,
      );

      expect(metadata).toEqual([UserRole.TEACHER]);
    });

    it('should set STUDENT role metadata on a method', () => {
      class TestController {
        @Roles(UserRole.STUDENT)
        studentMethod() {}
      }

      const metadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.studentMethod,
      );

      expect(metadata).toEqual([UserRole.STUDENT]);
    });
  });

  describe('Multiple Roles', () => {
    it('should set multiple roles metadata on a method', () => {
      class TestController {
        @Roles(UserRole.ADMIN, UserRole.TEACHER)
        adminOrTeacherMethod() {}
      }

      const metadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.adminOrTeacherMethod,
      );

      expect(metadata).toEqual([UserRole.ADMIN, UserRole.TEACHER]);
      expect(metadata).toHaveLength(2);
    });

    it('should set all roles metadata on a method', () => {
      class TestController {
        @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
        anyRoleMethod() {}
      }

      const metadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.anyRoleMethod,
      );

      expect(metadata).toEqual([
        UserRole.ADMIN,
        UserRole.TEACHER,
        UserRole.STUDENT,
      ]);
      expect(metadata).toHaveLength(3);
    });

    it('should handle duplicate roles (array will contain duplicates)', () => {
      class TestController {
        @Roles(UserRole.ADMIN, UserRole.ADMIN)
        duplicateMethod() {}
      }

      const metadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.duplicateMethod,
      );

      expect(metadata).toEqual([UserRole.ADMIN, UserRole.ADMIN]);
      expect(metadata).toHaveLength(2);
    });
  });

  describe('Empty Roles', () => {
    it('should handle no roles (empty array)', () => {
      class TestController {
        @Roles()
        noRolesMethod() {}
      }

      const metadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.noRolesMethod,
      );

      expect(metadata).toEqual([]);
      expect(metadata).toHaveLength(0);
    });
  });

  describe('Different Methods', () => {
    it('should set different roles for different methods', () => {
      class TestController {
        @Roles(UserRole.ADMIN)
        adminOnly() {}

        @Roles(UserRole.TEACHER)
        teacherOnly() {}

        @Roles(UserRole.STUDENT)
        studentOnly() {}

        @Roles(UserRole.ADMIN, UserRole.TEACHER)
        staffOnly() {}
      }

      const adminMetadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.adminOnly,
      );
      const teacherMetadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.teacherOnly,
      );
      const studentMetadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.studentOnly,
      );
      const staffMetadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.staffOnly,
      );

      expect(adminMetadata).toEqual([UserRole.ADMIN]);
      expect(teacherMetadata).toEqual([UserRole.TEACHER]);
      expect(studentMetadata).toEqual([UserRole.STUDENT]);
      expect(staffMetadata).toEqual([UserRole.ADMIN, UserRole.TEACHER]);
    });

    it('should not affect methods without the decorator', () => {
      class TestController {
        @Roles(UserRole.ADMIN)
        protectedMethod() {}

        publicMethod() {}
      }

      const protectedMetadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.protectedMethod,
      );
      const publicMetadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.publicMethod,
      );

      expect(protectedMetadata).toEqual([UserRole.ADMIN]);
      expect(publicMetadata).toBeUndefined();
    });
  });

  describe('Class-level Decorator', () => {
    it('should work as a class decorator', () => {
      @Roles(UserRole.ADMIN)
      class AdminController {
        someMethod() {}
      }

      const metadata = Reflect.getMetadata(ROLES_KEY, AdminController);

      expect(metadata).toEqual([UserRole.ADMIN]);
    });

    it('should allow different roles at class and method level', () => {
      @Roles(UserRole.ADMIN)
      class MixedController {
        @Roles(UserRole.TEACHER)
        teacherMethod() {}

        adminMethod() {}
      }

      const classMetadata = Reflect.getMetadata(ROLES_KEY, MixedController);
      const methodMetadata = Reflect.getMetadata(
        ROLES_KEY,
        MixedController.prototype.teacherMethod,
      );
      const adminMethodMetadata = Reflect.getMetadata(
        ROLES_KEY,
        MixedController.prototype.adminMethod,
      );

      expect(classMetadata).toEqual([UserRole.ADMIN]);
      expect(methodMetadata).toEqual([UserRole.TEACHER]);
      expect(adminMethodMetadata).toBeUndefined(); // No method-level decorator
    });
  });

  describe('Role Values', () => {
    it('should use correct UserRole enum values', () => {
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.TEACHER).toBe('teacher');
      expect(UserRole.STUDENT).toBe('student');
    });

    it('should preserve role order as provided', () => {
      class TestController {
        @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
        reverseOrderMethod() {}
      }

      const metadata = Reflect.getMetadata(
        ROLES_KEY,
        TestController.prototype.reverseOrderMethod,
      );

      expect(metadata[0]).toBe(UserRole.STUDENT);
      expect(metadata[1]).toBe(UserRole.TEACHER);
      expect(metadata[2]).toBe(UserRole.ADMIN);
    });
  });
});
