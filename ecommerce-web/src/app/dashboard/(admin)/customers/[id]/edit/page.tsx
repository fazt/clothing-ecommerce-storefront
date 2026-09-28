import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { customersApi } from "@/lib/api";
import { CustomerForm } from "../../customer-form";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await customersApi.get(id).catch(() => null);
  if (!customer) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Editar cliente" description={customer.email} />
      {/* Only the editable fields cross to the client; the API also returns orders. */}
      <CustomerForm
        initial={{ id: customer.id, name: customer.name, email: customer.email }}
      />
    </div>
  );
}
