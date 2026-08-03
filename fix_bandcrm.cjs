const fs = require('fs');
let code = fs.readFileSync('src/components/BandCRM.tsx', 'utf-8');

// Replace handleSaveBand
code = code.replace(
  /const handleSaveBand = \(e: React.FormEvent\) => \{[\s\S]*?setIsModalOpen\(false\);\n  \};/,
  `const handleSaveBand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Por favor introduce el nombre de la banda.');
      return;
    }

    if (editingBand) {
      // Update existing
      const updated: BandContact = {
        ...editingBand,
        nombre_banda: formName.trim(),
        estilo_musical: formStyle.trim(),
        localizacion: formLocation.trim(),
        estado_relacion: formStatus,
        ultimo_contacto: formLastContact,
        contacto_nombre: formContactName.trim(),
        email: formEmail.trim(),
        telefono: formPhone.trim(),
        instagram: formInstagram.trim(),
        spotify_youtube: formSpotifyYoutube.trim(),
        aforo_promedio: Number(formAforo) || 0,
        notas_colaboracion: formNotes.trim(),
        ciudad_origen_swap: formLocation.trim()
      };

      setBands(prev => prev.map(b => b.id === editingBand.id ? updated : b));

      try {
        await fetch(\`/api/bands/\${updated.id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch (err) {
        console.error("Error updating band on server:", err);
      }

      // Also sync back to main leads list if onUpdateLead is provided
      if (onUpdateLead) {
        onUpdateLead(editingBand.id, {
          nombre_sala: updated.nombre_banda,
          genero: updated.estilo_musical,
          ciudad: updated.localizacion,
          contacto_nombre: updated.contacto_nombre,
          email_contacto: updated.email,
          telefono: updated.telefono,
          instagram: updated.instagram,
          notas: updated.notas_colaboracion
        });
      }
    } else {
      // Create new
      const newBand: BandContact = {
        id: \`band-\${Date.now()}\`,
        nombre_banda: formName.trim(),
        estilo_musical: formStyle.trim(),
        localizacion: formLocation.trim(),
        estado_relacion: formStatus,
        ultimo_contacto: formLastContact || new Date().toISOString().split('T')[0],
        contacto_nombre: formContactName.trim(),
        email: formEmail.trim(),
        telefono: formPhone.trim(),
        instagram: formInstagram.trim(),
        spotify_youtube: formSpotifyYoutube.trim(),
        aforo_promedio: Number(formAforo) || 300,
        notas_colaboracion: formNotes.trim(),
        ciudad_origen_swap: formLocation.trim()
      };

      setBands(prev => [newBand, ...prev]);

      try {
        await fetch(\`/api/bands\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBand)
        });
      } catch (err) {
        console.error("Error creating band on server:", err);
      }

      // Sync to main leads list if onAddLead is provided
      if (onAddLead) {
        onAddLead({
          id: newBand.id,
          nombre_sala: newBand.nombre_banda,
          ciudad: newBand.localizacion,
          region: newBand.localizacion,
          aforo: newBand.aforo_promedio || 300,
          genero: newBand.estilo_musical,
          tipo: 'grupo',
          email_contacto: newBand.email || '',
          telefono: newBand.telefono || '',
          instagram: newBand.instagram || '',
          contacto_nombre: newBand.contacto_nombre || '',
          fuente: 'Red de Co-Booking Bandas',
          estado: 'pendiente_aprobacion',
          pitch_generado: \`Propuesta Date Swap: Bakandeya x \${newBand.nombre_banda}\`,
          notas: newBand.notas_colaboracion || ''
        });
      }
    }

    setIsModalOpen(false);
  };`
);

// Replace handleDeleteBand
code = code.replace(
  /const handleDeleteBand = \(id: string, name: string\) => \{[\s\S]*?\};/,
  `const handleDeleteBand = async (id: string, name: string) => {
    if (window.confirm(\`¿Estás seguro de eliminar el contacto de la banda "\${name}"?\`)) {
      setBands(prev => prev.filter(b => b.id !== id));
      try {
        await fetch(\`/api/bands/\${id}\`, { method: 'DELETE' });
      } catch(err) {
        console.error("Error deleting band", err);
      }
    }
  };`
);

// Replace handleQuickStatusChange
code = code.replace(
  /const handleQuickStatusChange = \(id: string, newStatus: BandRelationshipStatus\) => \{[\s\S]*?\};/,
  `const handleQuickStatusChange = async (id: string, newStatus: BandRelationshipStatus) => {
    const today = new Date().toISOString().split('T')[0];
    
    let updatedBand: BandContact | undefined;
    setBands(prev => prev.map(b => {
      if (b.id === id) {
        updatedBand = { ...b, estado_relacion: newStatus, ultimo_contacto: today };
        return updatedBand;
      }
      return b;
    }));

    if (updatedBand) {
      try {
        await fetch(\`/api/bands/\${id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedBand)
        });
      } catch (err) {
        console.error("Error updating quick status", err);
      }
    }
  };`
);

fs.writeFileSync('src/components/BandCRM.tsx', code);
console.log("Fixed src/components/BandCRM.tsx");
