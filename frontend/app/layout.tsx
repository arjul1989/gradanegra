import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { DialogProvider } from "@/contexts/DialogContext";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Grada Negra - Tu Próximo Evento Inolvidable",
  description: "Descubre eventos únicos y compra tus tickets de forma segura",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  console.log('🚀 Script inicial ejecutándose...');
                  const saved = localStorage.getItem('theme');
                  console.log('💾 LocalStorage theme:', saved);
                  
                  if (!saved) {
                    console.log('🆕 Forzando DARK por defecto');
                    localStorage.setItem('theme', 'dark');
                    document.documentElement.classList.add('dark');
                  } else if (saved === 'dark') {
                    console.log('🌙 Aplicando DARK desde localStorage');
                    document.documentElement.classList.add('dark');
                  } else {
                    console.log('☀️ Aplicando LIGHT desde localStorage');
                    document.documentElement.classList.remove('dark');
                  }
                  
                  console.log('✅ Clase aplicada:', document.documentElement.className);
                } catch (e) {
                  console.error('❌ Error en script inicial:', e);
                }
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  console.log('🔒 Iniciando prevención de zoom...');
                  
                  // Prevenir zoom con gestos táctiles (pinch-to-zoom)
                  document.addEventListener('touchmove', function(event) {
                    if (event.scale !== 1) {
                      event.preventDefault();
                    }
                  }, { passive: false });

                  // Prevenir doble tap para zoom
                  let lastTouchEnd = 0;
                  document.addEventListener('touchend', function(event) {
                    const now = Date.now();
                    if (now - lastTouchEnd <= 300) {
                      event.preventDefault();
                    }
                    lastTouchEnd = now;
                  }, false);

                  // Prevenir zoom con gestos (para navegadores que soporten gesturestart)
                  document.addEventListener('gesturestart', function(event) {
                    event.preventDefault();
                  }, false);

                  // Prevenir zoom con Ctrl + rueda del mouse (desktop)
                  document.addEventListener('wheel', function(event) {
                    if (event.ctrlKey) {
                      event.preventDefault();
                    }
                  }, { passive: false });

                  // Prevenir zoom con teclado (Ctrl/Cmd + + o -)
                  document.addEventListener('keydown', function(event) {
                    if ((event.ctrlKey || event.metaKey) && 
                        (event.key === '+' || event.key === '-' || event.key === '=')) {
                      event.preventDefault();
                    }
                  }, false);

                  // Reajustar la escala si cambia
                  let initialScale = window.visualViewport ? window.visualViewport.scale : 1;
                  if (window.visualViewport) {
                    window.visualViewport.addEventListener('resize', function() {
                      const currentScale = window.visualViewport.scale;
                      if (currentScale !== initialScale && currentScale !== 1) {
                        console.log('⚠️ Zoom detectado, reajustando...');
                        // Forzar recarga del viewport
                        const viewport = document.querySelector('meta[name="viewport"]');
                        if (viewport) {
                          viewport.setAttribute('content', 
                            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
                          );
                        }
                      }
                    });
                  }

                  console.log('✅ Prevención de zoom activada');
                } catch (e) {
                  console.error('❌ Error en script de prevención de zoom:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <DialogProvider>
          {children}
            <ThemeToggle />
          </DialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
