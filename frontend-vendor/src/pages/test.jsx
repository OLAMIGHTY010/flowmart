<div
  class="export-wrapper"
  style="
    width: 375px;
    min-height: 812px;
    position: relative;
    font-family: var(--font-family-body);
    background-color: var(--background);
  "
>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@100;200;300;400;500;600;700;800;900&family=Geist:wght@100;200;300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@100;200;300;400;500;600;700&family=IBM+Plex+Sans:wght@100;200;300;400;500;600;700&family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Nunito:wght@200;300;400;500;600;700;800;900&family=PT+Serif:wght@400;700&family=Roboto+Slab:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@100;300;400;500;700;900&family=Shantell+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
    rel="stylesheet"
  />
  <html>
    <head>
      <style>
        /*! tailwindcss v4.3.0 | MIT License | https://tailwindcss.com */
        @layer properties;
        @layer theme, base, components, utilities;
        @layer theme {
          :root,
          :root {
            --font-sans:
              ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
              "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
            --font-mono:
              ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
              "Liberation Mono", "Courier New", monospace;
            --color-red-100: oklch(93.6% 0.032 17.717);
            --color-red-700: oklch(50.5% 0.213 27.518);
            --color-yellow-100: oklch(97.3% 0.071 103.193);
            --color-yellow-700: oklch(55.4% 0.135 66.442);
            --color-green-100: oklch(96.2% 0.044 156.743);
            --color-green-700: oklch(52.7% 0.154 150.069);
            --color-blue-100: oklch(93.2% 0.032 255.585);
            --color-blue-700: oklch(48.8% 0.243 264.376);
            --color-neutral-100: #f3f4f6;
            --color-white: #fff;
            --spacing: 0.25rem;
            --text-xs: 12px;
            --text-xs--line-height: calc(1 / 0.75);
            --text-sm: 14px;
            --text-sm--line-height: calc(1.25 / 0.875);
            --text-base: 16px;
            --text-base--line-height: calc(1.5 / 1);
            --text-lg: 18px;
            --text-lg--line-height: calc(1.75 / 1.125);
            --text-xl: 20px;
            --text-xl--line-height: calc(1.75 / 1.25);
            --text-2xl: 24px;
            --text-2xl--line-height: calc(2 / 1.5);
            --font-weight-medium: 500;
            --font-weight-semibold: 600;
            --font-weight-bold: 700;
            --leading-tight: 1.25;
            --leading-snug: 1.375;
            --leading-relaxed: 1.625;
            --radius-sm: 4px;
            --radius-lg: 12px;
            --radius-xl: 24px;
            --radius-2xl: 1rem;
            --default-font-family: var(--font-sans);
            --default-mono-font-family: var(--font-mono);
            --radius: var(--radius-sm);
            --color-background: #ffffff;
            --color-foreground: #111827;
            --color-border: #e5e7eb;
            --color-primary: hsla(142, 76%, 36%, 1.00);
            --color-primary-foreground: hsla(0, 0%, 100%, 1.00);
            --color-secondary: #dcfce7;
            --color-secondary-foreground: #16a34a;
            --color-muted: #f3f4f6;
            --color-muted-foreground: #6b7280;
            --color-warning: #f59e0b;
            --color-error: #ef4444;
            --color-sidebar: #1a1f2e;
            --color-sidebar-foreground: #ffffff;
            --font-body: Inter;
            --font-headings: Inter;
          }
        }
        @layer base {
          *,
          ::after,
          ::before,
          ::backdrop,
          ::file-selector-button {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            border: 0 solid;
          }
          html,
          :root {
            line-height: 1.5;
            -webkit-text-size-adjust: 100%;
            tab-size: 4;
            font-family: var(
              --default-font-family,
              ui-sans-serif,
              system-ui,
              sans-serif,
              "Apple Color Emoji",
              "Segoe UI Emoji",
              "Segoe UI Symbol",
              "Noto Color Emoji"
            );
            font-feature-settings: var(--default-font-feature-settings, normal);
            font-variation-settings: var(
              --default-font-variation-settings,
              normal
            );
            -webkit-tap-highlight-color: transparent;
          }
          hr {
            height: 0;
            color: inherit;
            border-top-width: 1px;
          }
          abbr:where([title]) {
            -webkit-text-decoration: underline dotted;
            text-decoration: underline dotted;
          }
          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            font-size: inherit;
            font-weight: inherit;
          }
          a {
            color: inherit;
            -webkit-text-decoration: inherit;
            text-decoration: inherit;
          }
          b,
          strong {
            font-weight: bolder;
          }
          code,
          kbd,
          samp,
          pre {
            font-family: var(
              --default-mono-font-family,
              ui-monospace,
              SFMono-Regular,
              Menlo,
              Monaco,
              Consolas,
              "Liberation Mono",
              "Courier New",
              monospace
            );
            font-feature-settings: var(
              --default-mono-font-feature-settings,
              normal
            );
            font-variation-settings: var(
              --default-mono-font-variation-settings,
              normal
            );
            font-size: 1em;
          }
          small {
            font-size: 80%;
          }
          sub,
          sup {
            font-size: 75%;
            line-height: 0;
            position: relative;
            vertical-align: baseline;
          }
          sub {
            bottom: -0.25em;
          }
          sup {
            top: -0.5em;
          }
          table {
            text-indent: 0;
            border-color: inherit;
            border-collapse: collapse;
          }
          :-moz-focusring {
            outline: auto;
          }
          progress {
            vertical-align: baseline;
          }
          summary {
            display: list-item;
          }
          ol,
          ul,
          menu {
            list-style: none;
          }
          img,
          svg,
          video,
          canvas,
          audio,
          iframe,
          embed,
          object {
            display: block;
            vertical-align: middle;
          }
          img,
          video {
            max-width: 100%;
            height: auto;
          }
          button,
          input,
          select,
          optgroup,
          textarea,
          ::file-selector-button {
            font: inherit;
            font-feature-settings: inherit;
            font-variation-settings: inherit;
            letter-spacing: inherit;
            color: inherit;
            border-radius: 0;
            background-color: transparent;
            opacity: 1;
          }
          :where(select:is([multiple], [size])) optgroup {
            font-weight: bolder;
          }
          :where(select:is([multiple], [size])) optgroup option {
            padding-inline-start: 20px;
          }
          ::file-selector-button {
            margin-inline-end: 4px;
          }
          ::placeholder {
            opacity: 1;
          }
          @supports (not (-webkit-appearance: -apple-pay-button)) or
            (contain-intrinsic-size: 1px) {
            ::placeholder {
              color: currentcolor;
              @supports (color: color-mix(in lab, red, red)) {
                color: color-mix(in oklab, currentcolor 50%, transparent);
              }
            }
          }
          textarea {
            resize: vertical;
          }
          ::-webkit-search-decoration {
            -webkit-appearance: none;
          }
          ::-webkit-date-and-time-value {
            min-height: 1lh;
            text-align: inherit;
          }
          ::-webkit-datetime-edit {
            display: inline-flex;
          }
          ::-webkit-datetime-edit-fields-wrapper {
            padding: 0;
          }
          ::-webkit-datetime-edit,
          ::-webkit-datetime-edit-year-field,
          ::-webkit-datetime-edit-month-field,
          ::-webkit-datetime-edit-day-field,
          ::-webkit-datetime-edit-hour-field,
          ::-webkit-datetime-edit-minute-field,
          ::-webkit-datetime-edit-second-field,
          ::-webkit-datetime-edit-millisecond-field,
          ::-webkit-datetime-edit-meridiem-field {
            padding-block: 0;
          }
          ::-webkit-calendar-picker-indicator {
            line-height: 1;
          }
          :-moz-ui-invalid {
            box-shadow: none;
          }
          button,
          input:where([type="button"], [type="reset"], [type="submit"]),
          ::file-selector-button {
            appearance: button;
          }
          ::-webkit-inner-spin-button,
          ::-webkit-outer-spin-button {
            height: auto;
          }
          [hidden]:where(:not([hidden="until-found"])) {
            display: none !important;
          }
        }
        @layer utilities {
          .absolute {
            position: absolute;
          }
          .relative {
            position: relative;
          }
          .inset-0 {
            inset: calc(var(--spacing) * 0);
          }
          .inset-0\.5 {
            inset: calc(var(--spacing) * 0.5);
          }
          .inset-8 {
            inset: calc(var(--spacing) * 8);
          }
          .-top-1 {
            top: calc(var(--spacing) * -1);
          }
          .-top-1\.5 {
            top: calc(var(--spacing) * -1.5);
          }
          .top-0 {
            top: calc(var(--spacing) * 0);
          }
          .-right-1 {
            right: calc(var(--spacing) * -1);
          }
          .-right-1\.5 {
            right: calc(var(--spacing) * -1.5);
          }
          .right-0 {
            right: calc(var(--spacing) * 0);
          }
          .right-3 {
            right: calc(var(--spacing) * 3);
          }
          .bottom-0 {
            bottom: calc(var(--spacing) * 0);
          }
          .left-0 {
            left: calc(var(--spacing) * 0);
          }
          .left-3 {
            left: calc(var(--spacing) * 3);
          }
          .mx-5 {
            margin-inline: calc(var(--spacing) * 5);
          }
          .mt-0\.5 {
            margin-top: calc(var(--spacing) * 0.5);
          }
          .mt-1 {
            margin-top: calc(var(--spacing) * 1);
          }
          .mt-2 {
            margin-top: calc(var(--spacing) * 2);
          }
          .mt-3 {
            margin-top: calc(var(--spacing) * 3);
          }
          .mt-4 {
            margin-top: calc(var(--spacing) * 4);
          }
          .mt-5 {
            margin-top: calc(var(--spacing) * 5);
          }
          .mb-1 {
            margin-bottom: calc(var(--spacing) * 1);
          }
          .mb-1\.5 {
            margin-bottom: calc(var(--spacing) * 1.5);
          }
          .mb-2 {
            margin-bottom: calc(var(--spacing) * 2);
          }
          .mb-3 {
            margin-bottom: calc(var(--spacing) * 3);
          }
          .mb-4 {
            margin-bottom: calc(var(--spacing) * 4);
          }
          .mb-5 {
            margin-bottom: calc(var(--spacing) * 5);
          }
          .mb-6 {
            margin-bottom: calc(var(--spacing) * 6);
          }
          .mb-7 {
            margin-bottom: calc(var(--spacing) * 7);
          }
          .mb-8 {
            margin-bottom: calc(var(--spacing) * 8);
          }
          .mb-10 {
            margin-bottom: calc(var(--spacing) * 10);
          }
          .ml-1 {
            margin-left: calc(var(--spacing) * 1);
          }
          .ml-1\.5 {
            margin-left: calc(var(--spacing) * 1.5);
          }
          .ml-2 {
            margin-left: calc(var(--spacing) * 2);
          }
          .ml-auto {
            margin-left: auto;
          }
          .block {
            display: block;
          }
          .flex {
            display: flex;
          }
          .grid {
            display: grid;
          }
          .h-2 {
            height: calc(var(--spacing) * 2);
          }
          .h-3 {
            height: calc(var(--spacing) * 3);
          }
          .h-4 {
            height: calc(var(--spacing) * 4);
          }
          .h-7 {
            height: calc(var(--spacing) * 7);
          }
          .h-8 {
            height: calc(var(--spacing) * 8);
          }
          .h-9 {
            height: calc(var(--spacing) * 9);
          }
          .h-10 {
            height: calc(var(--spacing) * 10);
          }
          .h-12 {
            height: calc(var(--spacing) * 12);
          }
          .h-16 {
            height: calc(var(--spacing) * 16);
          }
          .h-20 {
            height: calc(var(--spacing) * 20);
          }
          .h-24 {
            height: calc(var(--spacing) * 24);
          }
          .h-28 {
            height: calc(var(--spacing) * 28);
          }
          .h-56 {
            height: calc(var(--spacing) * 56);
          }
          .w-1 {
            width: calc(var(--spacing) * 1);
          }
          .w-2 {
            width: calc(var(--spacing) * 2);
          }
          .w-3 {
            width: calc(var(--spacing) * 3);
          }
          .w-4 {
            width: calc(var(--spacing) * 4);
          }
          .w-6 {
            width: calc(var(--spacing) * 6);
          }
          .w-7 {
            width: calc(var(--spacing) * 7);
          }
          .w-8 {
            width: calc(var(--spacing) * 8);
          }
          .w-9 {
            width: calc(var(--spacing) * 9);
          }
          .w-10 {
            width: calc(var(--spacing) * 10);
          }
          .w-12 {
            width: calc(var(--spacing) * 12);
          }
          .w-16 {
            width: calc(var(--spacing) * 16);
          }
          .w-20 {
            width: calc(var(--spacing) * 20);
          }
          .w-24 {
            width: calc(var(--spacing) * 24);
          }
          .w-52 {
            width: calc(var(--spacing) * 52);
          }
          .w-56 {
            width: calc(var(--spacing) * 56);
          }
          .w-64 {
            width: calc(var(--spacing) * 64);
          }
          .w-80 {
            width: calc(var(--spacing) * 80);
          }
          .w-full {
            width: 100%;
          }
          .w-max {
            width: max-content;
          }
          .w-px {
            width: 1px;
          }
          .flex-1 {
            flex: 1;
          }
          .flex-shrink-0 {
            flex-shrink: 0;
          }
          .-rotate-90 {
            rotate: calc(90deg * -1);
          }
          .grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .grid-cols-5 {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
          .flex-col {
            flex-direction: column;
          }
          .items-center {
            align-items: center;
          }
          .items-end {
            align-items: flex-end;
          }
          .items-start {
            align-items: flex-start;
          }
          .justify-around {
            justify-content: space-around;
          }
          .justify-between {
            justify-content: space-between;
          }
          .justify-center {
            justify-content: center;
          }
          .justify-end {
            justify-content: flex-end;
          }
          .gap-0 {
            gap: calc(var(--spacing) * 0);
          }
          .gap-0\.5 {
            gap: calc(var(--spacing) * 0.5);
          }
          .gap-1 {
            gap: calc(var(--spacing) * 1);
          }
          .gap-2 {
            gap: calc(var(--spacing) * 2);
          }
          .gap-3 {
            gap: calc(var(--spacing) * 3);
          }
          .gap-4 {
            gap: calc(var(--spacing) * 4);
          }
          .gap-5 {
            gap: calc(var(--spacing) * 5);
          }
          .gap-6 {
            gap: calc(var(--spacing) * 6);
          }
          .gap-8 {
            gap: calc(var(--spacing) * 8);
          }
          .gap-px {
            gap: 1px;
          }
          .overflow-hidden {
            overflow: hidden;
          }
          .overflow-x-hidden {
            overflow-x: hidden;
          }
          .rounded {
            border-radius: var(--radius);
          }
          .rounded-2xl {
            border-radius: var(--radius-2xl);
          }
          .rounded-full {
            border-radius: calc(infinity * 1px);
          }
          .rounded-lg {
            border-radius: var(--radius-lg);
          }
          .rounded-sm {
            border-radius: var(--radius-sm);
          }
          .rounded-xl {
            border-radius: var(--radius-xl);
          }
          .rounded-tl-lg {
            border-top-left-radius: var(--radius-lg);
          }
          .rounded-tr-lg {
            border-top-right-radius: var(--radius-lg);
          }
          .rounded-br-lg {
            border-bottom-right-radius: var(--radius-lg);
          }
          .rounded-bl-lg {
            border-bottom-left-radius: var(--radius-lg);
          }
          .border {
            border-style: var(--tw-border-style);
            border-width: 1px;
          }
          .border-2 {
            border-style: var(--tw-border-style);
            border-width: 2px;
          }
          .border-t {
            border-top-style: var(--tw-border-style);
            border-top-width: 1px;
          }
          .border-t-4 {
            border-top-style: var(--tw-border-style);
            border-top-width: 4px;
          }
          .border-r-4 {
            border-right-style: var(--tw-border-style);
            border-right-width: 4px;
          }
          .border-b {
            border-bottom-style: var(--tw-border-style);
            border-bottom-width: 1px;
          }
          .border-b-4 {
            border-bottom-style: var(--tw-border-style);
            border-bottom-width: 4px;
          }
          .border-l-4 {
            border-left-style: var(--tw-border-style);
            border-left-width: 4px;
          }
          .border-dashed {
            --tw-border-style: dashed;
            border-style: dashed;
          }
          .border-border {
            border-color: var(--color-border);
          }
          .border-error {
            border-color: var(--color-error);
          }
          .border-foreground {
            border-color: var(--color-foreground);
          }
          .border-primary {
            border-color: var(--color-primary);
          }
          .border-primary\/20 {
            border-color: color-mix(in srgb, #16a34a 20%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              border-color: color-mix(
                in oklab,
                var(--color-primary) 20%,
                transparent
              );
            }
          }
          .border-warning {
            border-color: var(--color-warning);
          }
          .border-white {
            border-color: var(--color-white);
          }
          .border-white\/10 {
            border-color: color-mix(in srgb, #fff 10%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              border-color: color-mix(
                in oklab,
                var(--color-white) 10%,
                transparent
              );
            }
          }
          .border-white\/20 {
            border-color: color-mix(in srgb, #fff 20%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              border-color: color-mix(
                in oklab,
                var(--color-white) 20%,
                transparent
              );
            }
          }
          .bg-background {
            background-color: var(--color-background);
          }
          .bg-blue-100 {
            background-color: var(--color-blue-100);
          }
          .bg-border {
            background-color: var(--color-border);
          }
          .bg-error {
            background-color: var(--color-error);
          }
          .bg-foreground {
            background-color: var(--color-foreground);
          }
          .bg-foreground\/50 {
            background-color: color-mix(in srgb, #111827 50%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              background-color: color-mix(
                in oklab,
                var(--color-foreground) 50%,
                transparent
              );
            }
          }
          .bg-green-100 {
            background-color: var(--color-green-100);
          }
          .bg-muted {
            background-color: var(--color-muted);
          }
          .bg-neutral-100 {
            background-color: var(--color-neutral-100);
          }
          .bg-primary {
            background-color: var(--color-primary);
          }
          .bg-primary\/70 {
            background-color: color-mix(in srgb, #16a34a 70%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              background-color: color-mix(
                in oklab,
                var(--color-primary) 70%,
                transparent
              );
            }
          }
          .bg-red-100 {
            background-color: var(--color-red-100);
          }
          .bg-secondary {
            background-color: var(--color-secondary);
          }
          .bg-secondary\/30 {
            background-color: color-mix(in srgb, #dcfce7 30%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              background-color: color-mix(
                in oklab,
                var(--color-secondary) 30%,
                transparent
              );
            }
          }
          .bg-sidebar {
            background-color: var(--color-sidebar);
          }
          .bg-transparent {
            background-color: transparent;
          }
          .bg-warning {
            background-color: var(--color-warning);
          }
          .bg-white {
            background-color: var(--color-white);
          }
          .bg-white\/10 {
            background-color: color-mix(in srgb, #fff 10%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              background-color: color-mix(
                in oklab,
                var(--color-white) 10%,
                transparent
              );
            }
          }
          .bg-white\/80 {
            background-color: color-mix(in srgb, #fff 80%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              background-color: color-mix(
                in oklab,
                var(--color-white) 80%,
                transparent
              );
            }
          }
          .bg-yellow-100 {
            background-color: var(--color-yellow-100);
          }
          .p-3 {
            padding: calc(var(--spacing) * 3);
          }
          .p-4 {
            padding: calc(var(--spacing) * 4);
          }
          .p-5 {
            padding: calc(var(--spacing) * 5);
          }
          .p-6 {
            padding: calc(var(--spacing) * 6);
          }
          .p-8 {
            padding: calc(var(--spacing) * 8);
          }
          .px-2 {
            padding-inline: calc(var(--spacing) * 2);
          }
          .px-3 {
            padding-inline: calc(var(--spacing) * 3);
          }
          .px-4 {
            padding-inline: calc(var(--spacing) * 4);
          }
          .px-5 {
            padding-inline: calc(var(--spacing) * 5);
          }
          .px-6 {
            padding-inline: calc(var(--spacing) * 6);
          }
          .px-8 {
            padding-inline: calc(var(--spacing) * 8);
          }
          .px-10 {
            padding-inline: calc(var(--spacing) * 10);
          }
          .py-0\.5 {
            padding-block: calc(var(--spacing) * 0.5);
          }
          .py-1 {
            padding-block: calc(var(--spacing) * 1);
          }
          .py-1\.5 {
            padding-block: calc(var(--spacing) * 1.5);
          }
          .py-2 {
            padding-block: calc(var(--spacing) * 2);
          }
          .py-2\.5 {
            padding-block: calc(var(--spacing) * 2.5);
          }
          .py-3 {
            padding-block: calc(var(--spacing) * 3);
          }
          .py-3\.5 {
            padding-block: calc(var(--spacing) * 3.5);
          }
          .py-4 {
            padding-block: calc(var(--spacing) * 4);
          }
          .py-5 {
            padding-block: calc(var(--spacing) * 5);
          }
          .py-8 {
            padding-block: calc(var(--spacing) * 8);
          }
          .pt-2 {
            padding-top: calc(var(--spacing) * 2);
          }
          .pt-3 {
            padding-top: calc(var(--spacing) * 3);
          }
          .pt-4 {
            padding-top: calc(var(--spacing) * 4);
          }
          .pt-5 {
            padding-top: calc(var(--spacing) * 5);
          }
          .pt-6 {
            padding-top: calc(var(--spacing) * 6);
          }
          .pt-8 {
            padding-top: calc(var(--spacing) * 8);
          }
          .pr-4 {
            padding-right: calc(var(--spacing) * 4);
          }
          .pb-1 {
            padding-bottom: calc(var(--spacing) * 1);
          }
          .pb-2 {
            padding-bottom: calc(var(--spacing) * 2);
          }
          .pb-3 {
            padding-bottom: calc(var(--spacing) * 3);
          }
          .pb-4 {
            padding-bottom: calc(var(--spacing) * 4);
          }
          .pb-6 {
            padding-bottom: calc(var(--spacing) * 6);
          }
          .pb-8 {
            padding-bottom: calc(var(--spacing) * 8);
          }
          .pb-10 {
            padding-bottom: calc(var(--spacing) * 10);
          }
          .text-center {
            text-align: center;
          }
          .text-left {
            text-align: left;
          }
          .text-right {
            text-align: right;
          }
          .font-body {
            font-family: var(--font-body);
          }
          .font-headings {
            font-family: var(--font-headings);
          }
          .text-2xl {
            font-size: var(--text-2xl);
            line-height: var(--tw-leading, var(--text-2xl--line-height));
          }
          .text-base {
            font-size: var(--text-base);
            line-height: var(--tw-leading, var(--text-base--line-height));
          }
          .text-lg {
            font-size: var(--text-lg);
            line-height: var(--tw-leading, var(--text-lg--line-height));
          }
          .text-sm {
            font-size: var(--text-sm);
            line-height: var(--tw-leading, var(--text-sm--line-height));
          }
          .text-xl {
            font-size: var(--text-xl);
            line-height: var(--tw-leading, var(--text-xl--line-height));
          }
          .text-xs {
            font-size: var(--text-xs);
            line-height: var(--tw-leading, var(--text-xs--line-height));
          }
          .leading-relaxed {
            --tw-leading: var(--leading-relaxed);
            line-height: var(--leading-relaxed);
          }
          .leading-snug {
            --tw-leading: var(--leading-snug);
            line-height: var(--leading-snug);
          }
          .leading-tight {
            --tw-leading: var(--leading-tight);
            line-height: var(--leading-tight);
          }
          .font-bold {
            --tw-font-weight: var(--font-weight-bold);
            font-weight: var(--font-weight-bold);
          }
          .font-medium {
            --tw-font-weight: var(--font-weight-medium);
            font-weight: var(--font-weight-medium);
          }
          .font-semibold {
            --tw-font-weight: var(--font-weight-semibold);
            font-weight: var(--font-weight-semibold);
          }
          .whitespace-nowrap {
            white-space: nowrap;
          }
          .text-blue-700 {
            color: var(--color-blue-700);
          }
          .text-error {
            color: var(--color-error);
          }
          .text-foreground {
            color: var(--color-foreground);
          }
          .text-green-700 {
            color: var(--color-green-700);
          }
          .text-muted-foreground {
            color: var(--color-muted-foreground);
          }
          .text-muted-foreground\/60 {
            color: color-mix(in srgb, #6b7280 60%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              color: color-mix(
                in oklab,
                var(--color-muted-foreground) 60%,
                transparent
              );
            }
          }
          .text-primary {
            color: var(--color-primary);
          }
          .text-primary-foreground {
            color: var(--color-primary-foreground);
          }
          .text-red-700 {
            color: var(--color-red-700);
          }
          .text-secondary-foreground {
            color: var(--color-secondary-foreground);
          }
          .text-sidebar-foreground {
            color: var(--color-sidebar-foreground);
          }
          .text-warning {
            color: var(--color-warning);
          }
          .text-white {
            color: var(--color-white);
          }
          .text-white\/50 {
            color: color-mix(in srgb, #fff 50%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              color: color-mix(in oklab, var(--color-white) 50%, transparent);
            }
          }
          .text-white\/60 {
            color: color-mix(in srgb, #fff 60%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              color: color-mix(in oklab, var(--color-white) 60%, transparent);
            }
          }
          .text-white\/70 {
            color: color-mix(in srgb, #fff 70%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              color: color-mix(in oklab, var(--color-white) 70%, transparent);
            }
          }
          .text-white\/80 {
            color: color-mix(in srgb, #fff 80%, transparent);
            @supports (color: color-mix(in lab, red, red)) {
              color: color-mix(in oklab, var(--color-white) 80%, transparent);
            }
          }
          .text-yellow-700 {
            color: var(--color-yellow-700);
          }
          .last\:border-b-0 {
            &:last-child {
              border-bottom-style: var(--tw-border-style);
              border-bottom-width: 0px;
            }
          }
          .last\:pb-0 {
            &:last-child {
              padding-bottom: calc(var(--spacing) * 0);
            }
          }
        }
        @property --tw-border-style {
          syntax: "*";
          inherits: false;
          initial-value: solid;
        }
        @property --tw-leading {
          syntax: "*";
          inherits: false;
        }
        @property --tw-font-weight {
          syntax: "*";
          inherits: false;
        }
        @layer properties {
          @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or
            ((-moz-orient: inline) and (not (color: rgb(from red r g b)))) {
            *,
            ::before,
            ::after,
            ::backdrop {
              --tw-border-style: solid;
              --tw-leading: initial;
              --tw-font-weight: initial;
            }
          }
        }
      </style>
    </head>
    <body>
      <div
        class="bg-background font-body flex flex-col"
        style="min-height: 812px"
        data-component="@screens/MobileLogin.jsx"
      >
        <div
          class="flex justify-between items-center px-5 pt-3 pb-1"
          data-component="@components/MobileStatusBar.jsx"
        >
          <span class="text-xs font-body font-semibold text-foreground"
            >9:41</span
          >
          <div class="flex items-center gap-1">
            <div class="flex gap-px items-end h-3">
              <div
                class="w-1 bg-foreground rounded-sm"
                style="height: 6px"
              ></div>
              <div
                class="w-1 bg-foreground rounded-sm"
                style="height: 8px"
              ></div>
              <div
                class="w-1 bg-foreground rounded-sm"
                style="height: 10px"
              ></div>
              <div
                class="w-1 bg-foreground rounded-sm"
                style="height: 12px"
              ></div>
            </div>
            <div
              class="w-4 h-3 border border-foreground rounded-sm relative ml-1"
            >
              <div class="absolute inset-0.5 bg-foreground rounded-sm"></div>
            </div>
          </div>
        </div>
        <div
          class="flex flex-col items-center justify-center flex-1 px-6 pt-8 pb-10"
        >
          <div class="flex items-center gap-2 mb-10">
            <div
              class="w-9 h-9 bg-primary rounded-lg flex items-center justify-center"
            >
              <span
                class="text-primary-foreground"
                style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  width: 20px;
                  height: 20px;
                "
                data-icon="leaf"
                data-component="@globalComponents/Icon.jsx"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20px"
                  height="20px"
                  viewBox="0 0 24 24"
                >
                  <g
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.4"
                  >
                    <path
                      d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8c0 5.5-4.78 10-10 10"
                    ></path>
                    <path
                      d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
                    ></path>
                  </g></svg
              ></span>
            </div>
            <span class="text-xl font-semibold text-foreground font-headings"
              >FlowMart</span
            >
          </div>
          <h1 class="text-2xl font-semibold text-foreground font-headings mb-1">
            <span data-file="/screens/MobileLogin.jsx" data-idx="0"
              >Welcome back</span
            >
          </h1>
          <p class="text-sm text-muted-foreground mb-8">
            <span data-file="/screens/MobileLogin.jsx" data-idx="1"
              >Login to your account</span
            >
          </p>
          <div class="w-full mb-4">
            <label class="block text-sm text-foreground font-medium mb-1"
              ><span data-file="/screens/MobileLogin.jsx" data-idx="2"
                >Email</span
              ></label
            >
            <div
              class="w-full border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground bg-background"
            >
              martha@email.com
            </div>
          </div>
          <div class="w-full mb-2">
            <label class="block text-sm text-foreground font-medium mb-1"
              ><span data-file="/screens/MobileLogin.jsx" data-idx="3"
                >Password</span
              ></label
            >
            <div
              class="w-full border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground bg-background flex justify-between items-center"
            >
              <span>••••••••</span
              ><span
                class=""
                style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  width: 16px;
                  height: 16px;
                "
                data-icon="eye"
                data-component="@globalComponents/Icon.jsx"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16px"
                  height="16px"
                  viewBox="0 0 24 24"
                >
                  <g
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                  >
                    <path
                      d="M2.062 12.348a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 19.876 0a1 1 0 0 1 0 .696a10.75 10.75 0 0 1-19.876 0"
                    ></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </g></svg
              ></span>
            </div>
          </div>
          <div class="w-full flex justify-end mb-6">
            <a
              class="text-sm text-primary font-medium"
              data-media-type="banani-button"
              ><span data-file="/screens/MobileLogin.jsx" data-idx="4"
                >Forgot password?</span
              ></a
            >
          </div>
          <button
            class="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold mb-6"
            data-media-type="banani-button"
          >
            <span data-file="/screens/MobileLogin.jsx" data-idx="5">Login</span>
          </button>
          <p class="text-sm text-muted-foreground">
            <span data-file="/screens/MobileLogin.jsx" data-idx="6"
              >Don't have an account?</span
            >
            <a
              class="text-primary font-semibold"
              data-media-type="banani-button"
              ><span data-file="/screens/MobileLogin.jsx" data-idx="7"
                >Sign up</span
              ></a
            >
          </p>
        </div>
      </div>
    </body>
  </html>
  <script src="https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js"></script>
</div>
