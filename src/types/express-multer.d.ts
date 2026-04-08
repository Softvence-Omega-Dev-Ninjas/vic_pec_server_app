/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { File as MulterFile } from 'multer';

declare global {
  namespace Express {
    namespace Multer {
      export interface File extends MulterFile {}
    }
  }
}

export {};
