<script setup>
import { ref } from "vue";
import { useSdms } from "../stores/sdms";
import AppIcon from "../components/AppIcon.vue";
const emit = defineEmits(["entered"]);
const st = useSdms();
const name = ref("");
const err = ref(false);
const go = () => {
  err.value = !st.signup(name.value);
  if (!err.value) emit("entered");
};
</script>

<template>
  <div class="welcome-layout">
    <section class="welcome-story" aria-labelledby="story-title">
      <span class="eyebrow story-eyebrow"><span /> THE SAINT JOSEPH WAY</span>
      <h1 id="story-title">
        Great futures start<br />with <em>good guidance.</em>
      </h1>
      <p>
        A thoughtful space to nurture discipline, celebrate progress, and help
        every student grow.
      </p>
      <div class="campus-scene">
        <img
          src="/campus.svg"
          alt="Illustration of a welcoming blue Saint Joseph school campus"
        /><span class="campus-badge"
          ><span class="campus-badge-icon"
            ><AppIcon name="shield" :size="23" /></span
          ><span
            ><strong>Every student matters.</strong
            ><small>Every step forward counts.</small></span
          ><AppIcon class="badge-sparkle" name="star" :size="24"
        /></span>
      </div>
      <div class="story-values">
        <span><AppIcon name="check" :size="16" /> Thoughtful guidance</span
        ><span><AppIcon name="check" :size="16" /> Lasting growth</span>
      </div>
    </section>

    <section class="login-card" aria-labelledby="login-title">
      <div class="login-card-handle" aria-hidden="true" />
      <div class="login-emblem">
        <AppIcon name="book" :size="30" /><AppIcon
          class="emblem-sparkle"
          name="star"
          :size="21"
        />
      </div>
      <span class="eyebrow">YOUR SCHOOL WORKSPACE</span>
      <h2 id="login-title">Welcome back.</h2>
      <p class="login-subtitle">
        A new day. A positive difference.<br />Let’s get you settled in.
      </p>
      <form @submit.prevent="go" novalidate>
        <label class="field" for="full-name">Your full name</label>
        <div class="login-input">
          <AppIcon name="user" :size="20" /><input
            id="full-name"
            v-model="name"
            autocomplete="name"
            placeholder="Enter your full name"
            :aria-invalid="err"
            :aria-describedby="err ? 'name-error' : 'name-help'"
            @input="err = false"
          />
        </div>
        <p v-if="err" id="name-error" class="form-error" role="alert">
          Please enter your full name to continue.
        </p>
        <p id="name-help" class="name-hint">
          Already joined? Use the name you signed up with.
        </p>
        <button class="primary-button login-submit" type="submit">
          Continue to workspace <AppIcon name="arrow-right" :size="19" />
        </button>
      </form>
      <div class="login-divider"><span />A space for your school<span /></div>
      <div class="login-benefits">
        <span><AppIcon name="students" :size="18" /> Student records</span
        ><span><AppIcon name="reports" :size="18" /> Clear insights</span>
      </div>
      <p class="login-footnote">
        New here? Enter your name to create your workspace account.
      </p>
      <div class="login-school-note">
        <AppIcon name="shield" :size="15" /><span
          >Built for the Saint Joseph community</span
        >
      </div>
    </section>
  </div>
  <footer class="welcome-footer">
    <span
      >© {{ new Date().getFullYear() }} Saint Joseph Integrated Technical
      College</span
    ><span>Discipline today. Possibilities tomorrow.</span>
  </footer>
</template>
