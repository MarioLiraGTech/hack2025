// app/dashboard/carritos/page.tsx

"use client";

// --- PASO 1: Importa useMemo, useEffect y Search ---
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";

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
  CardFooter, // Importa CardFooter
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
  tipo: "Mediano",
};

// --- PASO 2: Define constantes para la paginación ---
const ITEMS_PER_PAGE = 5;


// --- Componente Principal de la Página ---
export default function CarritosPage() {
  // --- Estados del Componente ---
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCarrito, setSelectedCarrito] = useState<CarritoType | null>(null);
  const [formData, setFormData] = useState<CarritoFormState>(initialState);

  // --- PASO 3: Añade estados para el filtro y la paginación ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // --- Hooks de Convex ---
  const carritos = useQuery(api.Carrito.getCarritos);
  const createCarrito = useMutation(api.Carrito.createCarrito);
  const updateCarrito = useMutation(api.Carrito.updateCarrito);
  const deleteCarrito = useMutation(api.Carrito.deleteCarrito);

  // --- PASO 4: Crea la lógica de filtrado con useMemo ---
  const filteredCarritos = useMemo(() => {
    if (!carritos) return [];
    if (!searchTerm) return carritos;

    const lowercasedFilter = searchTerm.toLowerCase();
    return carritos.filter(c =>
      c.nombre.toLowerCase().includes(lowercasedFilter) ||
      c.tipo.toLowerCase().includes(lowercasedFilter)
    );
  }, [carritos, searchTerm]);

  // --- PASO 5: Resetea la página a 1 cuando cambia el filtro ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // --- PASO 6: Crea la lógica de paginación con useMemo ---
  const paginatedCarritos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCarritos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCarritos, currentPage]);

  const totalPages = Math.ceil(filteredCarritos.length / ITEMS_PER_PAGE);

  // --- Manejadores de Eventos (Sin cambios) ---
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
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <CardTitle>Administración de Carritos</CardTitle>
            <CardDescription>
              Crea, edita y elimina los carritos disponibles.
            </CardDescription>
          </div>
          {/* --- PASO 7: Añade el Input de búsqueda --- */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o tipo..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Carrito
            </Button>
          </div>
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
                {/* --- PASO 8: Renderiza los datos filtrados y paginados --- */}
                {paginatedCarritos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {searchTerm ? "No se encontraron resultados." : "Aún no hay carritos. ¡Crea el primero!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCarritos.map((carrito) => (
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

        {/* --- PASO 9: Añade el CardFooter con los controles de paginación --- */}
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Siguiente
              </Button>
            </div>
          </CardFooter>
        )}
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el carrito
              <span className="font-semibold"> {selectedCarrito?.nombre}</span> de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row">
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}