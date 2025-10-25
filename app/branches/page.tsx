// app/dashboard/sucursales/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle } from "lucide-react";

// --- Importaciones de Componentes Shadcn/ui ---
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


// --- Definición de Tipos ---

// Tipo para el documento 'Sucursal' que viene de Convex. Incluye _id, _creationTime, etc.
type SucursalType = Doc<"Sucursal">;

// Tipo para el estado del formulario. Solo incluye los campos que el usuario llena.
type SucursalFormState = {
  nombre: string;
  direccion: string;
  pais: string;
  estado: string;
  codigo_postal: string;
  telefono?: string;
  correo?: string;
};

// --- Estado Inicial del Formulario ---
const initialState: SucursalFormState = {
  nombre: "",
  direccion: "",
  pais: "",
  estado: "",
  codigo_postal: "",
  telefono: "",
  correo: "",
};


// --- Componente Principal de la Página ---
export default function SucursalesPage() {
  // --- Estados del Componente ---
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState<SucursalType | null>(null);
  const [formData, setFormData] = useState<SucursalFormState>(initialState);

  // --- Hooks de Convex ---
  const sucursales = useQuery(api.Sucursal.getSucursales);
  const createSucursal = useMutation(api.Sucursal.createSucursal);
  const updateSucursal = useMutation(api.Sucursal.updateSucursal);
  const deleteSucursal = useMutation(api.Sucursal.deleteSucursal);

  // --- Manejadores de Eventos ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.promise(createSucursal(formData), {
      loading: "Creando sucursal...",
      success: "¡Sucursal creada con éxito!",
      error: (err) => `Error: ${err.data}`,
    });
    setFormData(initialState);
    setCreateDialogOpen(false);
  };

  const handleEdit = (sucursal: SucursalType) => {
    setSelectedSucursal(sucursal);
    setFormData({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      pais: sucursal.pais,
      estado: sucursal.estado,
      codigo_postal: sucursal.codigo_postal,
      telefono: sucursal.telefono || "",
      correo: sucursal.correo || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSucursal) return;

    toast.promise(
      updateSucursal({ id: selectedSucursal._id, ...formData }),
      {
        loading: "Actualizando sucursal...",
        success: "¡Sucursal actualizada con éxito!",
        error: (err) => `Error: ${err.data}`,
      }
    );
    setEditDialogOpen(false);
    setSelectedSucursal(null);
  };

  const confirmDelete = (sucursal: SucursalType) => {
    setSelectedSucursal(sucursal);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSucursal) return;
    toast.promise(deleteSucursal({ id: selectedSucursal._id }), {
      loading: "Eliminando sucursal...",
      success: `Sucursal "${selectedSucursal.nombre}" eliminada.`,
      error: (err) => `Error: ${err.data}`,
    });
    setDeleteDialogOpen(false);
    setSelectedSucursal(null);
  };

  // --- Renderizado Condicional de Carga ---
  if (sucursales === undefined) {
    return <div className="p-4">Cargando sucursales...</div>;
  }

  // --- JSX del Componente ---
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Administración de Sucursales</CardTitle>
            <CardDescription>
              Crea, edita y elimina las sucursales de tu organización.
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Sucursal
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="hidden md:table-cell">País</TableHead>
                <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                <TableHead>Fecha Registro</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sucursales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Aún no hay sucursales. ¡Crea la primera!
                  </TableCell>
                </TableRow>
              ) : (
                sucursales.map((sucursal) => (
                  <TableRow key={sucursal._id}>
                    <TableCell className="font-medium">{sucursal.nombre}</TableCell>
                    <TableCell>{sucursal.direccion}</TableCell>
                    <TableCell className="hidden md:table-cell">{sucursal.pais}</TableCell>
                    <TableCell className="hidden md:table-cell">{sucursal.telefono ?? "N/A"}</TableCell>
                    <TableCell>
                      {new Date(sucursal.fecha_registro).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(sucursal)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => confirmDelete(sucursal)}>
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- Dialogo para CREAR Sucursal --- */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Crear Nueva Sucursal</DialogTitle>
              <DialogDescription>
                Completa los datos para registrar una nueva sucursal.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {Object.keys(initialState).map((key) => (
                <div className="grid grid-cols-4 items-center gap-4" key={key}>
                  <Label htmlFor={key} className="text-right capitalize">
                    {key.replace("_", " ")}
                  </Label>
                  <Input
                    id={key}
                    value={formData[key as keyof SucursalFormState]}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required={!["telefono", "correo"].includes(key)}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Crear Sucursal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* --- Dialogo para EDITAR Sucursal --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Editar Sucursal</DialogTitle>
              <DialogDescription>
                Actualiza los datos de la sucursal seleccionada.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               {Object.keys(initialState).map((key) => (
                <div className="grid grid-cols-4 items-center gap-4" key={key}>
                  <Label htmlFor={key} className="text-right capitalize">
                    {key.replace("_", " ")}
                  </Label>
                  <Input
                    id={key}
                    value={formData[key as keyof SucursalFormState]}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required={!["telefono", "correo"].includes(key)}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* --- Dialogo de CONFIRMACIÓN para Eliminar --- */}
      <AlertDialog open={isDeleteDialogOpen} onOpenchange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la sucursal
              <span className="font-semibold"> {selectedSucursal?.nombre}</span> de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}