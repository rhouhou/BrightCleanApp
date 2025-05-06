import { useState } from "react";
import { FaEdit, FaTrashAlt, FaSave, FaBan } from "react-icons/fa";

// Helper to safely format date
const formatDateForInput = (val) => {
  try {
    return new Date(val).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const ItemsTable = ({
  columns,
  items,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  onToggleEditMode,
}) => {
  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <>
      <table className="table-bordered">
        <thead>
          <tr className="border border-gray-300">
            {columns.map((column) => (
              <th key={column.accessor} className="th-bordered">
                {column.header}
              </th>
            ))}
            <th className="th-bordered">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={item._id || `new-${index}`}
              className="border border-gray-300"
              style={{
                backgroundColor: item.isEditing
                  ? "#d4e6f1"
                  : item.isNew
                  ? "#fffacd"
                  : "transparent",
              }}
            >
              {columns.map((column) => (
                <td key={column.accessor} className="td-bordered">
                  {item.isEditing ? (
                    // Editable fields when item is being edited
                    column.type === "select" ? (
                      <select
                        value={item[column.accessor] || ""}
                        onChange={(e) => {
                          console.log(
                            `Editing ${column.accessor}:`,
                            e.target.value
                          ); // Debugging
                          onEdit(
                            item._id || item.IDmaterial,
                            column.accessor,
                            e.target.value,
                            item.isNew
                          );
                        }}
                        className="edit-input"
                      >
                        <option
                          value=""
                          disabled
                        >{`Select ${column.header}...`}</option>
                        {column.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : column.type === "date" ? (
                      <input
                        type="date"
                        value={formatDateForInput(item[column.accessor])}
                        onChange={(e) =>
                          onEdit(
                            item._id || item.IDmaterial,
                            column.accessor,
                            e.target.value,
                            item.isNew
                          )
                        }
                        className="edit-input"
                      />
                    ) : column.type === "number" ? (
                      <input
                        type="number"
                        step="any"
                        value={item[column.accessor] || ""}
                        onChange={(e) =>
                          onEdit(
                            item._id || item.IDmaterial,
                            column.accessor,
                            e.target.value,
                            item.isNew
                          )
                        }
                        onBlur={(e) => {
                          const formatted = parseFloat(e.target.value);
                          if (!isNaN(formatted)) {
                            onEdit(
                              item._id || item.IDmaterial,
                              column.accessor,
                              formatted.toFixed(5),
                              item.isNew
                            );
                          }
                        }}
                        className="edit-input"
                      />
                    ) : (
                      <input
                        type={column.type || "text"}
                        value={item[column.accessor] || ""}
                        onChange={(e) =>
                          onEdit(
                            item._id || item.IDmaterial,
                            column.accessor,
                            e.target.value,
                            item.isNew
                          )
                        }
                        className="edit-input"
                      />
                    )
                  ) : column.type === "date" ? (
                    // Render formatted date for non-edit mode
                    item[column.accessor] &&
                    !isNaN(new Date(item[column.accessor])) ? (
                      formatDateForInput(item[column.accessor])
                    ) : (
                      ""
                    )
                  ) : (
                    item[column.accessor]
                  )}
                </td>
              ))}
              <td className="td-bordered">
                <div className="actions-buttons">
                  {item.isEditing ? (
                    <>
                      <button
                        onClick={() => onSaveEdit(item, index, item.isNew)}
                        className="button button-savetb"
                      >
                        <FaSave />
                      </button>
                      <button
                        onClick={() => onCancelEdit(index, item.isNew)}
                        className="button button-canceltb"
                      >
                        <FaBan />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onToggleEditMode(index)}
                        className="button button-edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({ idOrIndex: item._id || index })
                        }
                        className="button button-delete"
                      >
                        <FaTrashAlt />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white text-black rounded-lg p-4 shadow-lg">
            <p className="mb-4">Are you sure you want to delete this item?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  onDelete(deleteTarget.idOrIndex);
                  setDeleteTarget(null); // Close the modal after deletion
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ItemsTable;
