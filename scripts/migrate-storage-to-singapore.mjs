import { createClient } from "@supabase/supabase-js";

const OLD_URL = process.env.OLD_SUPABASE_URL;
const OLD_KEY = process.env.OLD_SERVICE_ROLE_KEY;
const NEW_URL = process.env.NEW_SUPABASE_URL;
const NEW_KEY = process.env.NEW_SERVICE_ROLE_KEY;
const CONFIRM = process.env.CONFIRM_UPLOAD === "YES";

if (!OLD_URL || !OLD_KEY || !NEW_URL || !NEW_KEY) {
  console.error(
    "Set OLD_SUPABASE_URL, OLD_SERVICE_ROLE_KEY, NEW_SUPABASE_URL, dan NEW_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const oldClient = createClient(OLD_URL, OLD_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const newClient = createClient(NEW_URL, NEW_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKETS = [
  {
    id: "bukti-pembayaran",
    public: false,
    fileSizeLimit: 4194304,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
  },
  {
    id: "instruktur",
    public: true,
    fileSizeLimit: 4194304,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
  },
];

async function listFiles(client, bucket, prefix = "") {
  const files = [];
  const { data, error } = await client.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    throw new Error(`Gagal list ${bucket}/${prefix}: ${error.message}`);
  }

  for (const item of data ?? []) {
    if (item.name === ".emptyFolderPlaceholder") continue;

    const path = prefix ? `${prefix}/${item.name}` : item.name;
    const isFolder = item.id === null || item.metadata === null;

    if (isFolder) {
      files.push(...(await listFiles(client, bucket, path)));
    } else {
      files.push(path);
    }
  }

  return files;
}

async function ensureBucket(bucket) {
  const { error } = await newClient.storage.getBucket(bucket.id);

  if (!error) return;

  const { error: createError } = await newClient.storage.createBucket(
    bucket.id,
    {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    },
  );

  if (createError) {
    throw new Error(`Gagal membuat bucket ${bucket.id}: ${createError.message}`);
  }
}

async function main() {
  let total = 0;
  let copied = 0;

  for (const bucket of BUCKETS) {
    const files = await listFiles(oldClient, bucket.id);
    total += files.length;

    console.log(`\nBucket ${bucket.id}: ${files.length} file`);

    if (!CONFIRM) continue;

    await ensureBucket(bucket);

    for (const path of files) {
      const { data, error } = await oldClient.storage
        .from(bucket.id)
        .download(path);

      if (error || !data) {
        throw new Error(
          `Gagal download ${bucket.id}/${path}: ${error?.message ?? "file kosong"}`,
        );
      }

      const contentType = data.type || "application/octet-stream";
      const { error: uploadError } = await newClient.storage
        .from(bucket.id)
        .upload(path, data, { contentType, upsert: true });

      if (uploadError) {
        throw new Error(
          `Gagal upload ${bucket.id}/${path}: ${uploadError.message}`,
        );
      }

      copied += 1;
      console.log(`  ${copied}/${total} ${bucket.id}/${path}`);
    }
  }

  if (!CONFIRM) {
    console.log(
      `\nDRY RUN selesai. ${total} file ditemukan. Set CONFIRM_UPLOAD=YES untuk menyalin.`,
    );
    return;
  }

  console.log(`\nMigrasi storage selesai. ${copied}/${total} file disalin.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});