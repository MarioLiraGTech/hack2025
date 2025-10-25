// app/dashboard/carritos/page.tsx

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
// --- Nueva importación para el Selector ---
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// --- Tipos Específicos para Carrito ---
type CarritoType = Doc<"Carrito">;

type CarritoFormState = {
  nombre: string;
  tipo: "Mediano" | "Largo";
};

// --- Estado Inicial del Formulario ---
const initialState: CarritoFormState = {
  nombre: "",
  tipo: "Mediano", // Valor por defecto
};


// --- Componente Principal de la Página ---
export default function CarritosPage() {
  // --- Estados del Componente ---
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCarrito, setSelectedCarrito] = useState<CarritoType | null>(null);
  const [formData, setFormData] = useState<CarritoFormState>(initialState);

  // --- Hooks de Convex (Asegúrate que el archivo es 'Carrito.ts') ---
  const carritos = useQuery(api.Carrito.getCarritos);
  const createCarrito = useMutation(api.Carrito.createCarrito);
  const updateCarrito = useMutation(api.Carrito.updateCarrito);
  const deleteCarrito = useMutation(api.Carrito.deleteCarrito);

  // --- Manejadores de Eventos ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: "Mediano" | "Largo") => {
    setFormData((prev) => ({ ...prev, tipo: value }));
  };
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.promise(createCarrito(formData), {
      loading: "Creando carrito...",
      success: "¡Carrito creado con éxito!",
      error: (err) => `Error: ${err.data}`,
    });
    setFormData(initialState);
    setCreateDialogOpen(false);
  };

  const handleEdit = (carrito: CarritoType) => {
    setSelectedCarrito(carrito);
    setFormData({
      nombre: carrito.nombre,
      tipo: carrito.tipo,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarrito) return;

    toast.promise(
      updateCarrito({ id: selectedCarrito._id, ...formData }),
      {
        loading: "Actualizando carrito...",
        success: "¡Carrito actualizado con éxito!",
        error: (err) => `Error: ${err.data}`,
      }
    );
    setEditDialogOpen(false);
    setSelectedCarrito(null);
  };

  const confirmDelete = (carrito: CarritoType) => {
    setSelectedCarrito(carrito);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCarrito) return;
    toast.promise(deleteCarrito({ id: selectedCarrito._id }), {
      loading: "Eliminando carrito...",
      success: `Carrito "${selectedCarrito.nombre}" eliminado.`,
      error: (err) => `Error: ${err.data}`,
    });
    setDeleteDialogOpen(false);
    setSelectedCarrito(null);
  };

  // --- Renderizado Condicional de Carga ---
  if (carritos === undefined) {
    return <div className="p-4 sm:p-6">Cargando carritos...</div>;
  }

  // --- JSX del Componente ---
  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Administración de Carritos</CardTitle>
            <CardDescription>
              Crea, edita y elimina los carritos disponibles.
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Carrito
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carritos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Aún no hay carritos. ¡Crea el primero!
                    </TableCell>
                  </TableRow>
                ) : (
                  carritos.map((carrito) => (
                    <TableRow key={carrito._id}>
                      <TableCell className="font-medium">{carrito.nombre}</TableCell>
                      <TableCell>{carrito.tipo}</TableCell>
                      <TableCell>
                        {new Date(carrito.fecha_registro).toLocaleDateString()}
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
                            <DropdownMenuItem onClick={() => handleEdit(carrito)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDelete(carrito)}>
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
          </div>
        </CardContent>
      </Card>

      {/* --- Dialogo para CREAR Carrito --- */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Carrito</DialogTitle>
              <DialogDescription>
                Completa los datos para registrar un nuevo carrito.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={formData.nombre} onChange={handleInputChange} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select onValueChange={handleSelectChange} defaultValue={formData.tipo}>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mediano">Mediano</SelectItem>
                    <SelectItem value="Largo">Largo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Crear Carrito</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* --- Dialogo para EDITAR Carrito --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Editar Carrito</DialogTitle>
              <DialogDescription>
                Actualiza los datos del carrito seleccionado.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={formData.nombre} onChange={handleInputChange} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select onValueChange={handleSelectChange} value={formData.tipo}>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mediano">Mediano</SelectItem>
                    <SelectItem value="Largo">Largo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row">
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el carrito
              <span className="font-semibold"> {selectedCarrito?.nombre}</span> de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}