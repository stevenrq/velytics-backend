import { VehicleImagesService } from './vehicle-images.service';
import {
  DuplicateImageException,
  KeyMismatchException,
  UploadedObjectNotFoundException,
  VehicleNotFoundException,
} from './exceptions/vehicle-image.exceptions';

describe('VehicleImagesService', () => {
  const bucketName = 'velytics-vehicles-test';

  function buildService(overrides?: {
    vehicleCount?: number;
    headObject?: unknown;
    findFirst?: unknown;
    imageCount?: number;
  }) {
    const prisma = {
      vehicle: {
        count: jest.fn().mockResolvedValue(overrides?.vehicleCount ?? 1),
      },
      vehicleImage: {
        findFirst: jest.fn().mockResolvedValue(overrides?.findFirst ?? null),
        count: jest.fn().mockResolvedValue(overrides?.imageCount ?? 1),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 1,
          ...data,
        })),
        findMany: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockImplementation((fn) => fn(prisma)),
    };

    const s3 = {
      bucketName,
      presignUpload: jest
        .fn()
        .mockResolvedValue('https://s3.example.com/upload'),
      presignDownload: jest
        .fn()
        .mockResolvedValue('https://s3.example.com/download'),
      headObject: jest
        .fn()
        .mockResolvedValue(
          overrides?.headObject === undefined
            ? { contentType: 'image/jpeg', contentLength: 1024 }
            : overrides.headObject,
        ),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    return {
      service: new VehicleImagesService(prisma as never, s3 as never),
      prisma,
      s3,
    };
  }

  it('rejects presigned upload for a nonexistent vehicle', async () => {
    const { service } = buildService({ vehicleCount: 0 });
    await expect(
      service.presignedUpload(99, {
        contentType: 'image/jpeg',
        size: 100_000,
      }),
    ).rejects.toThrow(VehicleNotFoundException);
  });

  it('generates a key scoped to the vehicle with the right extension', async () => {
    const { service, s3 } = buildService();
    const result = await service.presignedUpload(5, {
      contentType: 'image/png',
      size: 100_000,
    });
    expect(result.key).toMatch(/^vehicles\/5\/[0-9a-f-]+\.png$/);
    expect(result.bucket).toBe(bucketName);
    expect(s3.presignUpload).toHaveBeenCalledWith(result.key, 'image/png');
  });

  it('rejects confirm-upload when the key does not belong to the vehicle', async () => {
    const { service } = buildService();
    await expect(
      service.confirmUpload(5, {
        fileName: 'a.jpg',
        contentType: 'image/jpeg',
        size: 10,
        key: 'vehicles/6/other.jpg',
      }),
    ).rejects.toThrow(KeyMismatchException);
  });

  it('rejects confirm-upload when the S3 object does not exist', async () => {
    const { service } = buildService({ headObject: null });
    await expect(
      service.confirmUpload(5, {
        fileName: 'a.jpg',
        contentType: 'image/jpeg',
        size: 10,
        key: 'vehicles/5/a.jpg',
      }),
    ).rejects.toThrow(UploadedObjectNotFoundException);
  });

  it('clears other primary images when confirming a new primary image', async () => {
    const { service, prisma } = buildService();
    await service.confirmUpload(5, {
      fileName: 'a.jpg',
      contentType: 'image/jpeg',
      size: 1024,
      key: 'vehicles/5/a.jpg',
      primary: true,
    });
    expect(prisma.vehicleImage.updateMany).toHaveBeenCalledWith({
      where: { vehicleId: 5, isPrimary: true },
      data: { isPrimary: false },
    });
    expect(prisma.vehicleImage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPrimary: true }),
      }),
    );
  });

  it('forces the first image of a vehicle to be primary even if not requested', async () => {
    const { service, prisma } = buildService({ imageCount: 0 });
    const result = await service.confirmUpload(5, {
      fileName: 'a.jpg',
      contentType: 'image/jpeg',
      size: 1024,
      key: 'vehicles/5/a.jpg',
    });
    expect(result.isPrimary).toBe(true);
    expect(prisma.vehicleImage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPrimary: true }),
      }),
    );
  });

  it('does not force primary on a non-first image when not requested', async () => {
    const { service } = buildService({ imageCount: 1 });
    const result = await service.confirmUpload(5, {
      fileName: 'a.jpg',
      contentType: 'image/jpeg',
      size: 1024,
      key: 'vehicles/5/a.jpg',
    });
    expect(result.isPrimary).toBe(false);
  });

  it('deletes the orphaned S3 object when confirm-upload hits a dedupe conflict', async () => {
    const { service, s3 } = buildService({ findFirst: { id: 1 } });
    await expect(
      service.confirmUpload(5, {
        fileName: 'a.jpg',
        contentType: 'image/jpeg',
        size: 1024,
        key: 'vehicles/5/a.jpg',
      }),
    ).rejects.toThrow(DuplicateImageException);
    expect(s3.deleteObject).toHaveBeenCalledWith('vehicles/5/a.jpg');
  });

  it('lists images ordered primary-first, then oldest first', async () => {
    const { service, prisma } = buildService();
    await service.list(5);
    expect(prisma.vehicleImage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      }),
    );
  });

  it('promotes the next oldest image to primary after deleting the primary one', async () => {
    const { service, prisma } = buildService();
    prisma.vehicleImage.findFirst
      .mockResolvedValueOnce({
        id: 1,
        key: 'vehicles/5/a.jpg',
        isPrimary: true,
      })
      .mockResolvedValueOnce({ id: 2 });

    await service.remove(5, 1);

    expect(prisma.vehicleImage.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(prisma.vehicleImage.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { isPrimary: true },
    });
  });

  it('does not try to promote a new primary when the deleted image was not primary', async () => {
    const { service, prisma } = buildService();
    prisma.vehicleImage.findFirst.mockResolvedValueOnce({
      id: 1,
      key: 'vehicles/5/a.jpg',
      isPrimary: false,
    });

    await service.remove(5, 1);

    expect(prisma.vehicleImage.update).not.toHaveBeenCalled();
  });
});
