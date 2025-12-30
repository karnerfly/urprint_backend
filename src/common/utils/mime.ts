import _mime from 'mime-types';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  // 'application/rtf',
  // 'application/vnd.ms-excel',
  // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // 'text/csv',
  // 'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.presentation',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/bmp',
  'image/gif',
  'image/heic',
  'image/webp',
  'application/epub+zip',
];

class Mime {
  lookup(contentType: string) {
    return ALLOWED_MIME_TYPES.find((t) => t === contentType);
  }
}

const mime = new Mime();
export default mime;
