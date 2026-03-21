UPDATE storage.buckets SET file_size_limit = 524288000 WHERE id = 'videos';
UPDATE storage.buckets SET file_size_limit = 20971520 WHERE id = 'documents';
UPDATE storage.buckets SET file_size_limit = 20971520 WHERE id = 'submissions';
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'receipts';