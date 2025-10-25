"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";

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
  CardFooter,
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

type SucursalType = Doc<"Sucursal">;

type SucursalFormState = {
  nombre: string;
  direccion: string;
  pais: string;
  estado: string;
  codigo_postal: string;
  telefono?: string;
  correo?: string;
};

const initialState: SucursalFormState = {
  nombre: "",
  direccion: "",
  pais: "",
  estado: "",
  codigo_postal: "",
  telefono: "",
  correo: "",
};

const ITEMS_PER_PAGE = 5;

export default function SucursalesPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState<SucursalType | null>(null);
  const [formData, setFormData] = useState<SucursalFormState>(initialState);

  // Estados para filtro y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const sucursales = useQuery(api.Sucursal.getSucursales);
  const createSucursal = useMutation(api.Sucursal.createSucursal);
  const updateSucursal = useMutation(api.Sucursal.updateSucursal);
  const deleteSucursal = useMutation(api.Sucursal.deleteSucursal);

  // Lógica de filtrado
  const filteredSucursales = useMemo(() => {
    if (!sucursales) return [];
    if (!searchTerm) return sucursales;

    const lowercasedFilter = searchTerm.toLowerCase();
    return sucursales.filter(s =>
      s.nombre.toLowerCase().includes(lowercasedFilter) ||
      s.direccion.toLowerCase().includes(lowercasedFilter) ||
      s.pais.toLowerCase().includes(lowercasedFilter) ||
      s.estado.toLowerCase().includes(lowercasedFilter) ||
      s.correo?.toLowerCase().includes(lowercasedFilter) ||
      s.telefono?.toLowerCase().includes(lowercasedFilter)
    );
  }, [sucursales, searchTerm]);

  // Resetea a la página 1 cuando el filtro cambia
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Lógica de paginación
  const paginatedSucursales = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSucursales.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSucursales, currentPage]);

  const totalPages = Math.ceil(filteredSucursales.length / ITEMS_PER_PAGE);

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

  if (sucursales === undefined) {
    return <div className="p-4 sm:p-6">Cargando sucursales...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <CardTitle>Administración de Sucursales</CardTitle>
            <CardDescription>
              Crea, edita y elimina las sucursales de tu organización.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar sucursal..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Sucursal
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
                  <TableHead className="hidden md:table-cell">País</TableHead>
                  <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSucursales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {searchTerm ? "No se encontraron resultados." : "Aún no hay sucursales. ¡Crea la primera!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSucursales.map((sucursal) => (
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
          </div>
        </CardContent>
        
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
                <div className="flex flex-col gap-2" key={key}>
                  <Label htmlFor={key} className="text-left capitalize">
                    {key.replace("_", " ")}
                  </Label>
                  <Input
                    id={key}
                    value={formData[key as keyof SucursalFormState]}
                    onChange={handleInputChange}
                    required={!["telefono", "correo"].includes(key)}
                  />
                </div>
              ))}
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Crear Sucursal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
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
                <div className="flex flex-col gap-2" key={key}>
                  <Label htmlFor={key} className="text-left capitalize">
                    {key.replace("_", " ")}
                  </Label>
                  <Input
                    id={key}
                    value={formData[key as keyof SucursalFormState]}
                    onChange={handleInputChange}
                    required={!["telefono", "correo"].includes(key)}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la sucursal
              <span className="font-semibold"> {selectedSucursal?.nombre}</span> de la base de datos.
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