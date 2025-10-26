// app/dashboard/distribuidores/page.tsx

"use client";

// --- PASO 1: Importa useMemo y useEffect ---
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
// --- Importa el ícono de Búsqueda ---
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
  CardFooter, // --- Importa CardFooter ---
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
import { chartContainerStyle } from "@/styles/gridStyle";

// --- Tipos Específicos para Distribuidor ---
type DistribuidorType = Doc<"Distribuidor">;

type DistribuidorFormState = {
  nombre: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
};

// --- Estado Inicial del Formulario ---
const initialState: DistribuidorFormState = {
  nombre: "",
  correo: "",
  telefono: "",
  direccion: "",
};

// --- PASO 2: Define constantes para la paginación ---
const ITEMS_PER_PAGE = 5;


// --- Componente Principal de la Página ---
export default function DistribuidoresPage() {
  // --- Estados del Componente ---
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDistribuidor, setSelectedDistribuidor] = useState<DistribuidorType | null>(null);
  const [formData, setFormData] = useState<DistribuidorFormState>(initialState);

  // --- PASO 3: Añade estados para el filtro y la paginación ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // --- Hooks de Convex ---
  const distribuidores = useQuery(api.Distribuidor.getDistribuidores);
  const createDistribuidor = useMutation(api.Distribuidor.createDistribuidor);
  const updateDistribuidor = useMutation(api.Distribuidor.updateDistribuidor);
  const deleteDistribuidor = useMutation(api.Distribuidor.deleteDistribuidor);

  // --- PASO 4: Crea la lógica de filtrado con useMemo ---
  const filteredDistribuidores = useMemo(() => {
    if (!distribuidores) return [];
    if (!searchTerm) return distribuidores;

    const lowercasedFilter = searchTerm.toLowerCase();
    // Filtra por todos los campos relevantes
    return distribuidores.filter(d =>
      d.nombre.toLowerCase().includes(lowercasedFilter) ||
      (d.correo || "").toLowerCase().includes(lowercasedFilter) ||
      (d.telefono || "").toLowerCase().includes(lowercasedFilter) ||
      (d.direccion || "").toLowerCase().includes(lowercasedFilter)
    );
  }, [distribuidores, searchTerm]);

  // --- PASO 5: Resetea la página a 1 cuando cambia el filtro ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // --- PASO 6: Crea la lógica de paginación con useMemo ---
  const paginatedDistribuidores = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDistribuidores.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDistribuidores, currentPage]);

  const totalPages = Math.ceil(filteredDistribuidores.length / ITEMS_PER_PAGE);


  // --- Manejadores de Eventos (Sin cambios) ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.promise(createDistribuidor(formData), {
      loading: "Creando distribuidor...",
      success: "¡Distribuidor creado con éxito!",
      error: (err) => `Error: ${err.data}`,
    });
    setFormData(initialState);
    setCreateDialogOpen(false);
  };
  
  // ... (handleEdit, handleUpdate, confirmDelete, handleDelete no cambian)
  const handleEdit = (distribuidor: DistribuidorType) => {
    setSelectedDistribuidor(distribuidor);
    setFormData({
      nombre: distribuidor.nombre,
      correo: distribuidor.correo || "",
      telefono: distribuidor.telefono || "",
      direccion: distribuidor.direccion || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistribuidor) return;
    toast.promise(
      updateDistribuidor({ id: selectedDistribuidor._id, ...formData }),
      {
        loading: "Actualizando distribuidor...",
        success: "¡Distribuidor actualizado con éxito!",
        error: (err) => `Error: ${err.data}`,
      }
    );
    setEditDialogOpen(false);
    setSelectedDistribuidor(null);
  };

  const confirmDelete = (distribuidor: DistribuidorType) => {
    setSelectedDistribuidor(distribuidor);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedDistribuidor) return;
    toast.promise(deleteDistribuidor({ id: selectedDistribuidor._id }), {
      loading: "Eliminando distribuidor...",
      success: `Distribuidor "${selectedDistribuidor.nombre}" eliminado.`,
      error: (err) => `Error: ${err.data}`,
    });
    setDeleteDialogOpen(false);
    setSelectedDistribuidor(null);
  };
  // --- Renderizado Condicional de Carga ---
  if (distribuidores === undefined) {
    return <div className="p-4 sm:p-6">Cargando distribuidores...</div>;
  }

  // --- JSX del Componente ---
  return (
    <div className="general-styles">
      <main>
      <Card style={chartContainerStyle}>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <CardTitle>Administración de Distribuidores</CardTitle>
            <CardDescription>
              Crea, edita y elimina los distribuidores de tu organización.
            </CardDescription>
          </div>
          
          {/* --- PASO 7: Añade el Input de búsqueda y el botón --- */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar distribuidor..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Distribuidor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead className="hidden md:table-cell">Correo</TableHead>
                  <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* --- PASO 8: Renderiza los datos filtrados y paginados --- */}
                {paginatedDistribuidores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {searchTerm ? "No se encontraron resultados." : "Aún no hay distribuidores. ¡Crea el primero!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  // Usa 'paginatedDistribuidores' en lugar de 'distribuidores'
                  paginatedDistribuidores.map((distribuidor) => (
                    <TableRow key={distribuidor._id}>
                      <TableCell className="font-medium">{distribuidor.nombre}</TableCell>
                      <TableCell>{distribuidor.direccion ?? "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{distribuidor.correo ?? "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{distribuidor.telefono ?? "N/A"}</TableCell>
                      <TableCell>
                        {new Date(distribuidor.fecha_registro).toLocaleDateString()}
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
                            <DropdownMenuItem onClick={() => handleEdit(distribuidor)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDelete(distribuidor)}>
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

      {/* --- Dialogo para CREAR Distribuidor (Sin cambios) --- */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Distribuidor</DialogTitle>
              <DialogDescription>
                Completa los datos para registrar un nuevo distribuidor.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {Object.keys(initialState).map((key) => (
                <div className="flex flex-col gap-2" key={key}>
                  <Label htmlFor={key} className="text-left capitalize">
                    {key.replace("_", " ")}
                  </Label>
                  <Input
                    id={key}
                    value={formData[key as keyof DistribuidorFormState]}
                    onChange={handleInputChange}
                    required={key === "nombre"}
                  />
                </div>
              ))}
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Crear Distribuidor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* --- Dialogo para EDITAR Distribuidor (Sin cambios) --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Editar Distribuidor</DialogTitle>
              <DialogDescription>
                Actualiza los datos del distribuidor seleccionado.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               {Object.keys(initialState).map((key) => (
                <div className="flex flex-col gap-2" key={key}>
                  <Label htmlFor={key} className="text-left capitalize">
                    {key.replace("_", " ")}
                  </Label>
                  <Input
                    id={key}
                    value={formData[key as keyof DistribuidorFormState]}
                    onChange={handleInputChange}
                    required={key === "nombre"}
                  />
                </div>
              ))}
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


      {/* --- Dialogo de CONFIRMACIÓN para Eliminar (Sin cambios) --- */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el distribuidor
              <span className="font-semibold"> {selectedDistribuidor?.nombre}</span> de la base de datos.
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
      </main>
    </div>
  );
}