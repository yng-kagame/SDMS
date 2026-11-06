<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import AppIcon from "./AppIcon.vue";
import { getStudentPhoto, saveStudentPhoto } from "../lib/studentPhotos";

const props = defineProps({
  student: { type: Object, required: true },
  editable: { type: Boolean, default: false },
});
const previewUrl = ref("");
const loading = ref(true);
const uploading = ref(false);
const error = ref("");
const success = ref("");
let generation = 0;
let disposed = false;
let stopWatching;

function clearPreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
}
function showPhoto(photo) {
  clearPreview();
  if (photo) previewUrl.value = URL.createObjectURL(photo);
}
function storageError(cause) {
  if (cause?.name === "QuotaExceededError") {
    return "This photo could not be saved because browser storage is full. Free some storage and try again.";
  }
  return (
    cause?.message || "The passport photo could not be saved. Please try again."
  );
}
async function loadPhoto(studentId) {
  const version = ++generation;
  loading.value = true;
  uploading.value = false;
  error.value = "";
  success.value = "";
  clearPreview();
  try {
    const photo = await getStudentPhoto(studentId);
    if (!disposed && version === generation) showPhoto(photo);
  } catch (cause) {
    if (!disposed && version === generation) error.value = storageError(cause);
  } finally {
    if (!disposed && version === generation) loading.value = false;
  }
}

async function passportPhoto(file) {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const source = new Image();
      source.onload = () => resolve(source);
      source.onerror = () =>
        reject(
          new Error(
            "That image could not be opened. Choose a valid JPEG, PNG, or WebP photo.",
          ),
        );
      source.src = sourceUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 400;
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("This browser could not prepare the passport photo.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.max(
      canvas.width / image.naturalWidth,
      canvas.height / image.naturalHeight,
    );
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(
      image,
      (canvas.width - width) / 2,
      (canvas.height - height) / 2,
      width,
      height,
    );
    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (photo) =>
          photo
            ? resolve(photo)
            : reject(
                new Error(
                  "The passport photo could not be prepared. Try another image.",
                ),
              ),
        "image/jpeg",
        0.85,
      );
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function uploadPhoto(event) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = "";
  if (!file || loading.value || uploading.value) return;
  error.value = "";
  success.value = "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    error.value = "Choose a JPEG, PNG, or WebP passport photo.";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = "Choose a passport photo smaller than 5 MB.";
    return;
  }
  const studentId = props.student.id;
  const version = generation;
  uploading.value = true;
  try {
    const photo = await passportPhoto(file);
    // A selection change or unmount cancels an upload that has not yet started saving.
    if (disposed || version !== generation) return;
    await saveStudentPhoto(studentId, photo);
    if (!disposed && version === generation) {
      showPhoto(photo);
      success.value = "Passport photo saved.";
    }
  } catch (cause) {
    if (!disposed && version === generation) error.value = storageError(cause);
  } finally {
    if (!disposed && version === generation) uploading.value = false;
  }
}

onMounted(() => {
  stopWatching = watch(() => props.student.id, loadPhoto, { immediate: true });
});
onBeforeUnmount(() => {
  disposed = true;
  generation++;
  stopWatching?.();
  clearPreview();
});
</script>

<template>
  <div class="student-photo">
    <div class="passport-frame" :aria-busy="loading || uploading">
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="`${student.name}'s passport photo`"
      />
      <div v-else class="photo-placeholder">
        <AppIcon name="user" :size="37" />
        <span>{{ loading ? "Loading photo…" : "No photo" }}</span>
      </div>
    </div>
    <div v-if="editable" class="photo-controls">
      <label
        class="photo-upload"
        :class="{ 'photo-upload--busy': loading || uploading }"
      >
        <AppIcon name="upload" :size="15" />
        <span>{{
          uploading ? "Saving…" : previewUrl ? "Replace photo" : "Upload photo"
        }}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          :disabled="loading || uploading"
          :aria-label="`Upload passport photo for ${student.name}`"
          @change="uploadPhoto"
        />
      </label>
      <p class="photo-hint">JPEG, PNG or WebP · max 5 MB</p>
    </div>
    <p v-if="error" class="photo-error" role="alert">{{ error }}</p>
    <p v-if="success" class="photo-success" role="status">{{ success }}</p>
  </div>
</template>

<style scoped>
.student-photo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 230px;
  text-align: center;
}
.passport-frame {
  width: 102px;
  aspect-ratio: 3 / 4;
  flex-shrink: 0;
  border: 2px solid #e1e8f4;
  border-radius: 13px;
  overflow: hidden;
  background: #f0f4fc;
  box-shadow: 0 3px 12px #18325c08;
}
.passport-frame > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 100%;
  color: #62799d;
  padding: 10px 5px;
}
.photo-placeholder > span {
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.4;
}
.photo-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
}
.photo-upload {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 35px;
  padding: 8px 10px;
  border: 1px solid #dce4f3;
  border-radius: 9px;
  background: #fff;
  color: #355c98;
  font-size: 0.75rem;
  font-weight: 750;
  line-height: 1.4;
  cursor: pointer;
}
.photo-upload:hover {
  background: #f1f5ff;
  border-color: #aebfe0;
}
.photo-upload:focus-within {
  outline: 3px solid #7194e6;
  outline-offset: 3px;
}
.photo-upload--busy {
  opacity: 0.6;
  cursor: wait;
}
.photo-upload input {
  position: absolute;
  width: 1px;
  min-height: 0;
  height: 1px;
  opacity: 0;
  padding: 0;
  border: 0;
  overflow: hidden;
}
.photo-hint {
  max-width: 170px;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.6;
  color: #526582;
  margin: 0;
}
.photo-error,
.photo-success {
  margin: 0;
  font-size: 0.77rem;
  font-weight: 700;
  line-height: 1.6;
  overflow-wrap: anywhere;
  max-width: 230px;
}
.photo-error {
  color: #aa3550;
}
.photo-success {
  color: #25735b;
}
</style>
