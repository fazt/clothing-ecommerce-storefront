import { PageHeader } from "@/components/dashboard/page-header";
import { CustomerForm } from "../customer-form";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Nuevo cliente" description="Añade un cliente a tu base de clientes." />
      <CustomerForm />
    </div>
  );
}
