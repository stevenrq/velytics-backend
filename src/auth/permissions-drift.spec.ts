import 'reflect-metadata';
import { PERMISSIONS_KEY } from '../common/decorators/require-permissions.decorator';
import { PERMISSION_NAMES } from './permissions.catalog';
import { ALL_CONTROLLERS } from '../all-controllers';

describe('Permission catalog drift', () => {
  it('every @RequirePermissions(...) name referenced by a controller exists in the static catalog', () => {
    const referenced = new Set<string>();

    for (const controller of ALL_CONTROLLERS) {
      const classLevel: string[] =
        Reflect.getMetadata(PERMISSIONS_KEY, controller) ?? [];
      classLevel.forEach((permission) => referenced.add(permission));

      const prototype = controller.prototype as unknown as Record<
        string,
        unknown
      >;
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (name) => name !== 'constructor',
      );
      for (const methodName of methodNames) {
        const handler = prototype[methodName];
        const methodLevel: string[] =
          Reflect.getMetadata(PERMISSIONS_KEY, handler as object) ?? [];
        methodLevel.forEach((permission) => referenced.add(permission));
      }
    }

    expect(referenced.size).toBeGreaterThan(0);

    const unknown = [...referenced].filter(
      (permission) => !PERMISSION_NAMES.includes(permission),
    );
    expect(unknown).toEqual([]);
  });
});
