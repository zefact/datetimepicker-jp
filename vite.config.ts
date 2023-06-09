import autoprefixer from 'autoprefixer';
import alias from '@rollup/plugin-alias';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  if (mode === 'development') {
    return {
      build: {
        // 出力ディレクトリ
        outDir: 'dist',
        // ライブラリモード
        lib: {
          // inputファイル
          entry: 'src/main.ts',
          // フォーマット('es' | 'cjs' | 'umd' | 'iife')[]
          formats: ['iife'],
          // outputファイル名（拡張子は自動）
          fileName: 'main',
          name: 'Datetimepicker',
        },
        // ソースマップ作成(boolean | 'inline' | 'hidden')
        sourcemap: 'hidden',
        // minifyしない
        minify: false,
        // 出力ディレクトリをclearしない
        emptyOutDir: false,
      },
    };
  } else if (mode === 'css') {
    return {
      build: {
        cssCodeSplit: true,
        // 出力ディレクトリ
        outDir: 'dist',
        rollupOptions: {
          input: 'src/main.scss',
          output: {
            assetFileNames: 'main.css',
          },
        },
        // minifyしない
        minify: false,
        // 出力ディレクトリをclearしない
        emptyOutDir: false,
      },
      css: {
        postcss: {
          plugins: [autoprefixer],
        },
      },
    };
  } else if (mode === 'minifycss') {
    return {
      build: {
        cssCodeSplit: true,
        // 出力ディレクトリ
        outDir: 'dist',
        rollupOptions: {
          input: 'src/main.scss',
          output: {
            assetFileNames: 'main.min.css',
          },
        },
        // minifyしない
        minify: true,
        // 出力ディレクトリをclearしない
        emptyOutDir: false,
      },
      css: {
        postcss: {
          plugins: [autoprefixer],
        },
      },
    };
  } else {
    return {
      build: {
        // 出力ディレクトリ
        outDir: 'dist',
        // ライブラリモード
        lib: {
          // inputファイル
          entry: 'src/main.ts',
          // フォーマット('es' | 'cjs' | 'umd' | 'iife')[]
          formats: ['iife'],
          // outputファイル名（拡張子は自動）
          fileName: 'main.min',
          name: 'Datetimepicker',
        },
        // ソースマップ作成(boolean | 'inline' | 'hidden')
        sourcemap: 'hidden',
      },
    };
  }
});
