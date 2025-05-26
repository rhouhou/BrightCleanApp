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
  showActions = true,
}) => {
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 1) Do we have any grouped columns?
  const hasGroups = columns.some((col) => Array.isArray(col.columns));

  // 2) Build the “leaf” array of columns for rendering the body
  const leafColumns = columns.flatMap(col =>
        Array.isArray(col.columns) ? col.columns : [col]
  );

  return (
    <>
      <table className={`table-bordered ${showActions ? "" : "no-actions"}`}>
        <thead>
          {hasGroups ? (
            <>
              {/* ─── First row: group headers ───────────────────────── */}
              <tr className="border border-gray-300">
                {columns.map((col, i) =>
                  col.columns ? (
                    <th
                      key={i}
                      colSpan={col.columns.length}
                      className={`th-bordered ${
                        col.header === "Prices" ? "bg-yellow-50" : "bg-gray-100"
                      }`}
                    >
                      {col.header}
                    </th>
                  ) : (
                    <th key={i} rowSpan={2} className="th-bordered bg-gray-100">
                      {col.header}
                    </th>
                  )
                )}
                {showActions && (
                  <th rowSpan={2} className="th-bordered bg-gray-100">
                    Actions
                  </th>
                )}
              </tr>
              {/* ─── Second row: child headers ───────────────────────── */}
              <tr className="border border-gray-300">
                {columns.map((col, i) =>
                  Array.isArray(col.columns)
                    ? col.columns.map((child, j) => (
                        <th key={`${i}-${j}`} className="th-bordered bg-gray-100">
                          {child.header}
                        </th>
                      ))
                    : null
                )}
              </tr>
            </>
          ) : (
            // ─── No groups: your original single header row ──────────
            <tr className="border border-gray-300">
              {columns.map((column, colIndex) => (
                <th key={column.id ?? colIndex} className="th-bordered bg-gray-100">
                  {column.header}
                </th>
              ))}
              <th className="th-bordered bg-gray-100">Actions</th>
            </tr>
          )}
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
              {leafColumns.map((column, colIndex) => {
                const rawValue =
                  typeof column.accessor === "function"
                    ? column.accessor(item)
                    : item[column.accessor];
                // Determine conditional cell class if provided
                const cellClass = column.getCellClassName
                  ? column.getCellClassName(rawValue, item)
                  : "";
                return (
                  <td
                    key={column.id ?? colIndex}
                    className={`td-bordered ${cellClass}`}
                  >
                    {item.isEditing ? (
                      column.type === "select" ? (
                        <select
                          value={rawValue || ""}
                          onChange={(e) =>
                            onEdit(index, column.id, e.target.value, item.isNew)
                          }
                          className="edit-input"
                        >
                          <option value="" disabled>
                            {`Select ${column.header}...`}
                          </option>
                          {column.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : column.type === "date" ? (
                        <input
                          type="date"
                          value={formatDateForInput(rawValue)}
                          onChange={(e) =>
                            onEdit(index, column.id, e.target.value, item.isNew)
                          }
                          className="edit-input"
                        />
                      ) : column.type === "number" ? (
                        <input
                          type="number"
                          step="any"
                          value={rawValue || ""}
                          onChange={(e) =>
                            onEdit(index, column.id, e.target.value, item.isNew)
                          }
                          onBlur={(e) => {
                            const fmt = parseFloat(e.target.value);
                            if (!isNaN(fmt)) {
                              onEdit(
                                index,
                                column.id,
                                fmt.toFixed(5),
                                item.isNew
                              );
                            }
                          }}
                          className="edit-input"
                        />
                      ) : (
                        <input
                          type={column.type || "text"}
                          value={rawValue || ""}
                          onChange={(e) =>
                            onEdit(index, column.id, e.target.value, item.isNew)
                          }
                          className="edit-input"
                        />
                      )
                    ) : column.type === "date" ? (
                      rawValue && !isNaN(new Date(rawValue)) ? (
                        formatDateForInput(rawValue)
                      ) : (
                        ""
                      )
                    ) : (
                      rawValue
                    )}
                  </td>
                );
              })}

              {showActions && (
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
                            setDeleteTarget({
                              idOrIndex: item._id || index,
                              isNew: !!item.isNew,
                            })
                          }
                          className="button button-delete"
                        >
                          <FaTrashAlt />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              )}
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
                  onDelete(deleteTarget.idOrIndex, deleteTarget.isNew);
                  setDeleteTarget(null);
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
