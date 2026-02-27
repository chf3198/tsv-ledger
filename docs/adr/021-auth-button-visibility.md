# ADR-021: Auth Button Visibility

**Date**: 2026-02-26
**Status**: Accepted

## Context

The Sign In button in the app header became invisible after certain user interactions:

- After OAuth flow cancellation
- After Sign Out
- After page reload without session

The root cause was CSS conflicts between Pico CSS framework and custom button styles. Pico CSS applies heavy default styling to buttons, and our attempts to override with `!important`, inline styles, and specificity increases all failed.

## Decision

1. **Use `<span>` instead of `<button>`**: Avoid Pico CSS button styling entirely
2. **Single element with dynamic content**: One auth-btn element that changes text/behavior
3. **Explicit display property**: `.auth-btn { display: inline-flex }` ensures visibility
4. **Avatar support**: Show profile image when authenticated

**HTML Structure**:

```html
<span class="auth-btn" @click="...">
  <template x-if="auth.authenticated && auth.user?.image">
    <img :src="auth.user.image" class="avatar" />
  </template>
  <span x-text="auth.authenticated ? auth.user?.name : 'Sign In'"></span>
</span>
```

**CSS**:

```css
.auth-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  cursor: pointer;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  white-space: nowrap;
}
.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}
```

## Testing

Created comprehensive E2E tests:

- `tests/auth-visibility.spec.js`: Core visibility after state changes
- `tests/auth-responsive.spec.js`: Visibility at mobile/tablet/desktop
- `tests/auth-contrast.spec.js`: WCAG AA contrast verification
- `tests/helpers/auth-helpers.js`: Shared test utilities

Tests verify:

- Button visible on initial load
- Button visible after modal close
- Button visible after auth state changes
- Button visible after OAuth cancel (page reload)
- Button visible after logout and reload
- Button meets 4.5:1 contrast ratio (WCAG AA)

## Consequences

### Positive

- ✅ Button always visible regardless of auth state
- ✅ Profile avatar shown when authenticated
- ✅ No CSS framework conflicts
- ✅ Comprehensive test coverage prevents regression

### Negative

- ⚠️ Lost semantic `<button>` element (mitigated with cursor:pointer)
- ⚠️ Must avoid Pico CSS button classes in header

### Lessons Learned

- Framework CSS can override custom styles unpredictably
- Visual regression tests catch issues before production
- Single-element with dynamic content is more reliable than multiple conditional elements
