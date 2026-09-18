import React from 'react';

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch(error: Error) { console.error('Falha ao exibir o aplicativo:', error); }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-dvh bg-fundo flex items-center justify-center p-6">
        <section role="alert" className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <h1 className="text-2xl text-tinta">Não foi possível abrir esta tela</h1>
          <p className="my-4 text-stone-600">Recarregue o aplicativo para tentar novamente. Se o problema continuar, fale com o administrador.</p>
          <button className="rounded-xl bg-marca px-5 py-3 text-white" onClick={() => window.location.reload()}>Recarregar aplicativo</button>
        </section>
      </main>
    );
  }
}
