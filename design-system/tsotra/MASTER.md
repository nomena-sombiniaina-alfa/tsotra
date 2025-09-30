# Design System Master File — tsotra

> **Logique** : à la création d'une page, vérifier d'abord `design-system/pages/[page-name].md`.
> Si ce fichier existe, ses règles **surchargent** ce Master file.
> Sinon, suivre strictement les règles ci-dessous.

**Project:** tsotra
**Pattern:** Marketplace / Directory (généré par ui-ux-pro-max)
**Style:** Trust & Premium — palette adaptée de `my-self`
**Generated:** 2026-05-07

---

## Color Palette

Deux thèmes, chacun avec sa propre identité forte. Tokens neutres entre les deux.

### Light theme — blanc + bleu clair + fuchsia

| Role               | Hex                     | Variable                  |
|--------------------|-------------------------|---------------------------|
| Background         | `#ffffff`               | `--color-background`      |
| Surface (subtle)   | `#fdf6fc`               | `--color-surface`         |
| Surface tinted     | `#ecc6e8`               | `--color-surface-tinted`  |
| Foreground         | `#0a1224`               | `--color-foreground`      |
| Foreground muted   | `#1a3a6f`               | `--color-foreground-muted`|
| Primary (CTA)      | `#3b82f6`               | `--color-primary`         |
| Primary hover      | `#2563eb`               | `--color-primary-hover`   |
| On primary         | `#ffffff`               | `--color-on-primary`      |
| Accent             | `#c026d3`               | `--color-accent`          |
| Accent soft        | `#c084d0`               | `--color-accent-soft`     |
| Secondary          | `#d8a8e0`               | `--color-secondary`       |
| Border             | `rgba(10, 18, 36, 0.10)`| `--color-border`          |
| Border strong      | `rgba(10, 18, 36, 0.18)`| `--color-border-strong`   |
| Ring               | `rgba(192, 38, 211, 0.55)`| `--color-ring`          |
| Destructive        | `#b3121f`               | `--color-destructive`     |

**Body gradient (light)**
```
radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.18), transparent 32%),
radial-gradient(circle at 85% 0%, rgba(192, 38, 211, 0.18), transparent 38%),
radial-gradient(circle at 50% 100%, rgba(232, 121, 249, 0.22), transparent 45%);
```

### Dark theme — rouge sang + bleu nuit + noir

| Role               | Hex                       | Variable                  |
|--------------------|---------------------------|---------------------------|
| Background         | `#02050b`                 | `--color-background`      |
| Surface            | `#0c1d2e`                 | `--color-surface`         |
| Surface tinted     | `#122844`                 | `--color-surface-tinted`  |
| Foreground         | `#f2f4f8`                 | `--color-foreground`      |
| Foreground muted   | `#a7b0c5`                 | `--color-foreground-muted`|
| Primary (CTA)      | `#8b0000`                 | `--color-primary`         |
| Primary hover      | `#a8121e`                 | `--color-primary-hover`   |
| On primary         | `#ffffff`                 | `--color-on-primary`      |
| Accent             | `#b3121f`                 | `--color-accent`          |
| Accent soft        | `rgba(139, 0, 0, 0.18)`   | `--color-accent-soft`     |
| Secondary          | `#173354`                 | `--color-secondary`       |
| Border             | `rgba(255, 255, 255, 0.06)` | `--color-border`        |
| Border strong      | `rgba(255, 255, 255, 0.12)` | `--color-border-strong` |
| Ring               | `rgba(139, 0, 0, 0.55)`   | `--color-ring`            |
| Destructive        | `#d4183d`                 | `--color-destructive`     |

**Body gradient (dark)**
```
radial-gradient(circle at 10% 10%, rgba(139, 0, 0, 0.32), transparent 32%),
radial-gradient(circle at 85% 0%, rgba(15, 37, 64, 0.55), transparent 38%),
radial-gradient(circle at 50% 100%, rgba(12, 31, 51, 0.55), transparent 45%);
```

**Notes**
- Le primaire change de famille entre les thèmes (bleu clair en light, rouge sang en dark) — cohérent avec l'ADN de my-self.
- L'accent fuchsia n'est utilisé qu'en light. En dark, l'accent prend la teinte rouge.
- Tous les pairs foreground/background respectent **4.5:1** minimum.

---

## Typography

- **Heading & Body:** Inter (300, 400, 500, 600, 700)
- **Display occasionnel:** Fraunces (logo, h1 marketing) — gardé pour l'identité
- **Mood:** minimal, professional, premium, swiss

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap');
```

**Scale**

| Token       | Size                                          | Usage                |
|-------------|-----------------------------------------------|----------------------|
| `--text-xs` | `12px`                                        | hints, captions      |
| `--text-sm` | `14px`                                        | small labels         |
| `--text-base`| `16px`                                       | body                 |
| `--text-md` | `18px`                                        | large body           |
| `--text-lg` | `clamp(1.125rem, 1rem + 0.5vw, 1.35rem)`      | leads                |
| `--text-xl` | `clamp(1.4rem, 1.1rem + 1vw, 1.85rem)`        | h3                   |
| `--text-2xl`| `clamp(1.75rem, 1.3rem + 1.5vw, 2.4rem)`      | h2                   |
| `--text-3xl`| `clamp(2.2rem, 1.5rem + 2.5vw, 3.6rem)`       | h1                   |

---

## Spacing & Radius

| Token         | Value | Usage              |
|---------------|-------|--------------------|
| `--space-1`   | 4px   | tight gaps         |
| `--space-2`   | 8px   | inline             |
| `--space-3`   | 12px  | small padding      |
| `--space-4`   | 16px  | base               |
| `--space-5`   | 24px  | section padding    |
| `--space-6`   | 32px  | section margin     |
| `--space-7`   | 48px  | major sections     |
| `--space-8`   | 64px  | hero spacing       |
| `--space-9`   | 96px  | top-level rhythm   |

| Token          | Value | Usage           |
|----------------|-------|-----------------|
| `--radius-sm`  | 8px   | inputs, pills   |
| `--radius`     | 12px  | buttons, cards  |
| `--radius-lg`  | 18px  | feature cards   |
| `--radius-xl`  | 24px  | hero panels     |

---

## Shadows

**Light theme**
```css
--shadow-sm: 0 1px 2px rgba(10, 18, 36, 0.06);
--shadow-md: 0 8px 24px rgba(10, 18, 36, 0.08);
--shadow-lg: 0 24px 60px rgba(10, 18, 36, 0.10);
--shadow-glow: 0 0 0 3px rgba(192, 38, 211, 0.18), 0 8px 24px rgba(59, 130, 246, 0.18);
```

**Dark theme**
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
--shadow-md: 0 10px 36px rgba(0, 0, 0, 0.55);
--shadow-lg: 0 24px 60px rgba(0, 0, 0, 0.7);
--shadow-glow: 0 0 14px rgba(139, 0, 0, 0.55), 0 0 36px rgba(139, 0, 0, 0.3);
```

---

## Page Pattern: Marketplace / Directory

Source : ui-ux-pro-max — pattern conseillé pour un service qui agrège des opportunités.

- **Stratégie de conversion** : la barre de recherche EST le CTA principal. Réduire la friction.
- **Suggestions de recherches populaires** sous le champ.
- **Hiérarchie de la home :**
  1. Hero search-focused (avec champ + suggestions de domaines)
  2. Catégories visuelles (par domaine : communication, dev, social, etc.)
  3. Missions à la une (3-6 cards)
  4. Trust / Safety (engagements de la plateforme — adapte les 4 règles fondamentales)
  5. CTA secondaire : « Publier une mission »

- **Navbar** : lien direct « Publier une mission » bien visible.

---

## Style: Trust & Premium

Adapté de "Trust & Authority" du skill, avec une touche éditoriale (typo Fraunces sur le h1, gradients my-self).

- **Indicateurs de confiance** affichés explicitement (badges, statistiques de la plateforme, engagements).
- **Pas de promesses creuses** : chiffres exacts ou pas de chiffres.
- **Pas de pictogrammes émoji** — uniquement du SVG (Lucide-style).
- **Hover** : élévation douce + glow d'accent (couleur primaire à 18% opacité).

### Effets clés (autorisés)

- Badge hover (élévation + glow)
- Pulse léger sur les statistiques au scroll
- Reveal en cascade des cards (stagger 40ms)
- Crossfade entre thèmes (transition 220ms sur `background` et `color`)

---

## Component Specs

### Buttons

```css
.btn {
  display: inline-flex; align-items: center; gap: 0.55em;
  padding: 0.78em 1.4em;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform .12s ease, background .15s, box-shadow .15s, color .15s;
}
.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-primary:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-ring), 0 0 0 4px var(--color-primary);
}
.btn-ghost {
  background: transparent;
  color: var(--color-foreground);
  border: 1px solid var(--color-border-strong);
}
.btn-ghost:hover { background: var(--color-surface); }
```

### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  transition: border-color .15s, box-shadow .15s, transform .15s;
}
.card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Search bar (CTA principal du hero)

```css
.search-cta {
  display: flex; align-items: center; gap: 0.5em;
  padding: 0.4em;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  box-shadow: var(--shadow-glow);
}
.search-cta input {
  flex: 1;
  border: none; background: transparent;
  padding: 0.7em 1em;
  font-size: 1rem; color: var(--color-foreground);
}
.search-cta input::placeholder { color: var(--color-foreground-muted); }
.search-cta input:focus { outline: none; }
.search-cta .btn { border-radius: 999px; }
```

### Inputs

```css
.input {
  padding: 0.78em 0.95em;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-foreground);
  transition: border-color .15s, box-shadow .15s;
}
.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-ring);
}
```

---

## Anti-Patterns (interdits)

- Emojis en guise d'icônes → SVG uniquement.
- Gradients arc-en-ciel "AI" : un seul axe brand par thème (bleu↔fuchsia en light, rouge↔bleu nuit en dark).
- Texte en bas contraste (≥ 4.5:1 toujours).
- Hover qui décale le layout (utiliser `transform`, jamais `width`/`height`).
- Affichage de noms internes (variables, IDs API, codes techniques) côté utilisateur.
- Plus d'un CTA primaire visible par section.

---

## Pre-Delivery Checklist

- [ ] Aucun emoji utilisé comme icône (Lucide ou SVG locaux)
- [ ] `cursor: pointer` sur tous les éléments cliquables
- [ ] Transitions 150-300 ms sur états hover/focus/active
- [ ] Contraste ≥ 4.5:1 sur tout le texte body, ≥ 3:1 sur le secondaire
- [ ] `prefers-reduced-motion` respecté (transitions désactivées)
- [ ] Responsive testé à 375 / 768 / 1024 / 1440 px
- [ ] Aucun scroll horizontal mobile
- [ ] Focus visible au clavier (ring primaire)
- [ ] Test des deux thèmes indépendamment (pas seulement light → dark)
- [ ] Aucun jargon technique exposé dans l'UI
