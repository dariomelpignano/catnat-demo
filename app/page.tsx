import { CompanyForm } from './components/CompanyForm';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Demo Polizza Catnat</h1>
          <p className="text-muted-foreground">
            Sistema di precompilazione automatica per polizze catastrofi naturali
          </p>
        </div>
        <CompanyForm />
      </div>
    </main>
  );
}
