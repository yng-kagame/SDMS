const DATABASE_NAME = "sdms-student-photos";
const STORE_NAME = "photos";
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function photoKey(studentId) {
  if (
    (typeof studentId !== "number" && typeof studentId !== "string") ||
    !String(studentId).trim()
  ) {
    throw new Error("Choose a student before saving a passport photo.");
  }
  return String(studentId);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Photo storage is unavailable in this browser."));
      return;
    }

    let request;
    let cancelled = false;
    try {
      request = indexedDB.open(DATABASE_NAME, 1);
    } catch (error) {
      reject(error);
      return;
    }
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      if (cancelled) {
        database.close();
        return;
      }
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () =>
      reject(request.error || new Error("Photo storage could not be opened."));
    request.onblocked = () => {
      cancelled = true;
      reject(
        new Error(
          "Photo storage is busy in another tab. Close that tab and try again.",
        ),
      );
    };
  });
}

async function transact(mode, operation) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    let transaction;
    let request;
    try {
      transaction = database.transaction(STORE_NAME, mode);
      request = operation(transaction.objectStore(STORE_NAME));
    } catch (error) {
      database.close();
      reject(error);
      return;
    }
    // A request succeeding is not enough: only acknowledge a committed transaction.
    transaction.oncomplete = () => {
      database.close();
      resolve(request.result);
    };
    transaction.onabort = () => {
      database.close();
      reject(
        transaction.error ||
          request.error ||
          new Error("The passport photo could not be saved."),
      );
    };
    transaction.onerror = () => {
      // IndexedDB aborts the transaction after this event; onabort handles cleanup.
    };
  });
}

export async function getStudentPhoto(studentId) {
  const key = photoKey(studentId);
  const result = await transact("readonly", (store) => store.get(key));
  return result instanceof Blob ? result : null;
}

export async function saveStudentPhoto(studentId, photo) {
  const key = photoKey(studentId);
  if (
    !(photo instanceof Blob) ||
    !PHOTO_TYPES.has(photo.type) ||
    photo.size === 0
  ) {
    throw new Error("Choose a valid JPEG, PNG, or WebP passport photo.");
  }
  if (photo.size > 5 * 1024 * 1024) {
    throw new Error("Choose a passport photo smaller than 5 MB.");
  }
  await transact("readwrite", (store) => store.put(photo, key));
}

export async function deleteStudentPhoto(studentId) {
  const key = photoKey(studentId);
  await transact("readwrite", (store) => store.delete(key));
}
