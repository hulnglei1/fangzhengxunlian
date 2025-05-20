<template>
  <div class="training-materials-container">
    <h1 class="page-title">教学资料管理</h1>

    <!-- 功能区域 -->
    <div class="function-area">
      <div class="search-area">
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="输入文件名称搜索" 
          @input="searchMaterials"
        />
        <select v-model="categoryFilter" @change="filterMaterials">
          <option value="">所有分类</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
        <select v-model="dateFilter" @change="filterMaterials">
          <option value="">按上传日期</option>
          <option value="newest">最新上传</option>
          <option value="oldest">最早上传</option>
        </select>
        <button class="upload-btn" @click="showUploadModal = true">上传资料</button>
      </div>
    </div>

    <!-- 资料列表 -->
    <div class="materials-list">
      <table>
        <thead>
          <tr>
            <th><input type="checkbox" v-model="selectAll" @change="toggleSelectAll"></th>
            <th>文件名</th>
            <th>分类</th>
            <th>文件类型</th>
            <th>大小</th>
            <th>上传日期</th>
            <th>描述</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(material, index) in filteredMaterials" :key="material.id">
            <td><input type="checkbox" v-model="material.selected"></td>
            <td>{{ material.name }}</td>
            <td>{{ getCategoryName(material.categoryId) }}</td>
            <td>{{ material.fileType }}</td>
            <td>{{ formatFileSize(material.size) }}</td>
            <td>{{ formatDate(material.uploadDate) }}</td>
            <td>{{ material.description }}</td>
            <td class="actions">
              <button @click="previewMaterial(material)">预览</button>
              <button @click="downloadMaterial(material)">下载</button>
              <button @click="showEditModal(material)">编辑</button>
              <button @click="confirmDeleteMaterial(material)">删除</button>
            </td>
          </tr>
          <tr v-if="filteredMaterials.length === 0">
            <td colspan="8" class="no-data">暂无资料</td>
          </tr>
        </tbody>
      </table>
      <div class="batch-actions" v-if="anySelected">
        <button @click="confirmDeleteSelected">删除选中项</button>
      </div>
    </div>

    <!-- 上传资料弹窗 -->
    <div class="modal-backdrop" v-if="showUploadModal" @click="showUploadModal = false"></div>
    <div class="modal" v-if="showUploadModal">
      <div class="modal-header">
        <h3>上传资料</h3>
        <button class="modal-close" @click="showUploadModal = false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>资料名称</label>
          <input type="text" v-model="newMaterial.name" placeholder="请输入资料名称">
        </div>
        <div class="form-group">
          <label>资料分类</label>
          <select v-model="newMaterial.categoryId">
            <option value="">请选择分类</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>资料描述</label>
          <textarea v-model="newMaterial.description" rows="3" placeholder="请输入资料描述"></textarea>
        </div>
        <div class="form-group">
          <label>上传文件</label>
          <input type="file" @change="handleFileUpload">
          <div class="upload-preview" v-if="uploadPreview">
            <p>文件名: {{ uploadPreview.name }}</p>
            <p>文件大小: {{ formatFileSize(uploadPreview.size) }}</p>
            <p>文件类型: {{ uploadPreview.type }}</p>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="showUploadModal = false">取消</button>
        <button class="confirm-btn" @click="uploadMaterial" :disabled="!canUpload">上传</button>
      </div>
    </div>

    <!-- 编辑资料弹窗 -->
    <div class="modal-backdrop" v-if="showEditModal" @click="cancelEdit"></div>
    <div class="modal" v-if="showEditModal">
      <div class="modal-header">
        <h3>编辑资料</h3>
        <button class="modal-close" @click="cancelEdit">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>资料名称</label>
          <input type="text" v-model="editingMaterial.name" placeholder="请输入资料名称">
        </div>
        <div class="form-group">
          <label>资料分类</label>
          <select v-model="editingMaterial.categoryId">
            <option value="">请选择分类</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>资料描述</label>
          <textarea v-model="editingMaterial.description" rows="3" placeholder="请输入资料描述"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="cancelEdit">取消</button>
        <button class="confirm-btn" @click="saveMaterialEdit">保存</button>
      </div>
    </div>

    <!-- 预览资料弹窗 -->
    <div class="modal-backdrop" v-if="showPreviewModal" @click="closePreview"></div>
    <div class="modal preview-modal" v-if="showPreviewModal">
      <div class="modal-header">
        <h3>资料预览: {{ previewingMaterial.name }}</h3>
        <button class="modal-close" @click="closePreview">&times;</button>
      </div>
      <div class="modal-body preview-content">
        <!-- PDF预览 -->
        <iframe v-if="isPreviewablePdf" :src="previewingMaterial.url" width="100%" height="500px"></iframe>
        
        <!-- 图片预览 -->
        <img v-else-if="isPreviewableImage" :src="previewingMaterial.url" alt="预览图片">
        
        <!-- 视频预览 -->
        <video v-else-if="isPreviewableVideo" controls width="100%">
          <source :src="previewingMaterial.url" :type="previewingMaterial.fileType">
          您的浏览器不支持视频预览
        </video>
        
        <!-- 音频预览 -->
        <audio v-else-if="isPreviewableAudio" controls width="100%">
          <source :src="previewingMaterial.url" :type="previewingMaterial.fileType">
          您的浏览器不支持音频预览
        </audio>
        
        <!-- 不支持预览的文件类型 -->
        <div v-else class="no-preview">
          <p>无法预览该类型文件，请下载后查看</p>
          <p>文件类型: {{ previewingMaterial.fileType }}</p>
          <button @click="downloadMaterial(previewingMaterial)">下载文件</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div class="modal-backdrop" v-if="showDeleteConfirm" @click="cancelDelete"></div>
    <div class="modal delete-confirm-modal" v-if="showDeleteConfirm">
      <div class="modal-header">
        <h3>确认删除</h3>
        <button class="modal-close" @click="cancelDelete">&times;</button>
      </div>
      <div class="modal-body">
        <p v-if="deleteMode === 'single'">
          确定要删除资料 <strong>{{ materialToDelete.name }}</strong> 吗？此操作不可恢复。
        </p>
        <p v-else-if="deleteMode === 'multiple'">
          确定要删除已选中的 <strong>{{ selectedCount }}</strong> 项资料吗？此操作不可恢复。
        </p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="cancelDelete">取消</button>
        <button class="delete-btn" @click="deleteMaterial">确认删除</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MaterialsManagement',
  data() {
    return {
      // 资料列表
      materials: [],
      // 分类列表
      categories: [
        { id: 1, name: '仿真教学资料' },
        { id: 2, name: '视频教学资料' },
        { id: 3, name: '设备介绍' },
        { id: 4, name: '操作手册' },
        { id: 5, name: '其他资料' }
      ],
      
      // 筛选和搜索
      searchKeyword: '',
      categoryFilter: '',
      dateFilter: '',
      filteredMaterials: [],
      
      // 批量选择
      selectAll: false,
      
      // 新增资料
      showUploadModal: false,
      newMaterial: {
        name: '',
        categoryId: '',
        description: '',
        file: null
      },
      uploadPreview: null,
      
      // 编辑资料
      showEditModal: false,
      editingMaterial: null,
      
      // 预览资料
      showPreviewModal: false,
      previewingMaterial: null,
      
      // 删除确认
      showDeleteConfirm: false,
      materialToDelete: null,
      deleteMode: 'single' // 'single' or 'multiple'
    };
  },
  computed: {
    // 是否可以上传
    canUpload() {
      return this.newMaterial.name && 
             this.newMaterial.categoryId && 
             this.newMaterial.file;
    },
    
    // 是否有选中的项目
    anySelected() {
      return this.materials.some(material => material.selected);
    },
    
    // 选中的项目数量
    selectedCount() {
      return this.materials.filter(material => material.selected).length;
    },
    
    // 文件预览类型判断
    isPreviewablePdf() {
      return this.previewingMaterial && 
             (this.previewingMaterial.fileType === 'application/pdf');
    },
    
    isPreviewableImage() {
      return this.previewingMaterial && 
             this.previewingMaterial.fileType.startsWith('image/');
    },
    
    isPreviewableVideo() {
      return this.previewingMaterial && 
             this.previewingMaterial.fileType.startsWith('video/');
    },
    
    isPreviewableAudio() {
      return this.previewingMaterial && 
             this.previewingMaterial.fileType.startsWith('audio/');
    }
  },
  created() {
    this.loadMaterials();
  },
  methods: {
    // 加载资料列表
    loadMaterials() {
      // 模拟从API获取资料数据
      this.materials = [
        {
          id: 1,
          name: '装甲车操作手册.pdf',
          categoryId: 4,
          fileType: 'application/pdf',
          size: 1024 * 1024 * 2.5, // 2.5MB
          uploadDate: '2023-05-10T10:30:00',
          url: 'https://example.com/files/manual.pdf',
          description: '装甲车基本操作指南，包含驾驶和维护说明',
          selected: false
        },
        {
          id: 2,
          name: '战术通信培训视频.mp4',
          categoryId: 2,
          fileType: 'video/mp4',
          size: 1024 * 1024 * 15, // 15MB
          uploadDate: '2023-05-08T14:45:00',
          url: 'https://example.com/files/tactical_comms.mp4',
          description: '战场通信设备使用培训视频，包含实战应用场景',
          selected: false
        },
        {
          id: 3,
          name: '战术情境模拟.ppt',
          categoryId: 1,
          fileType: 'application/vnd.ms-powerpoint',
          size: 1024 * 1024 * 5.2, // 5.2MB
          uploadDate: '2023-05-05T09:15:00',
          url: 'https://example.com/files/simulation.ppt',
          description: '各种战术情境下的应对措施培训幻灯片',
          selected: false
        },
        {
          id: 4,
          name: '通信设备介绍.docx',
          categoryId: 3,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1024 * 1024 * 1.8, // 1.8MB
          uploadDate: '2023-05-03T16:20:00',
          url: 'https://example.com/files/equipment.docx',
          description: '最新型号通信设备的技术参数和使用说明',
          selected: false
        },
        {
          id: 5,
          name: '战场急救演示.mp3',
          categoryId: 2,
          fileType: 'audio/mp3',
          size: 1024 * 1024 * 3.5, // 3.5MB
          uploadDate: '2023-04-28T11:10:00',
          url: 'https://example.com/files/first_aid.mp3',
          description: '战场应急救护音频教程，包含抢救技巧讲解',
          selected: false
        }
      ];
      
      this.filterMaterials();
    },
    
    // 过滤资料列表
    filterMaterials() {
      let filtered = [...this.materials];
      
      // 关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        filtered = filtered.filter(material => 
          material.name.toLowerCase().includes(keyword) ||
          material.description.toLowerCase().includes(keyword)
        );
      }
      
      // 分类筛选
      if (this.categoryFilter) {
        filtered = filtered.filter(material => 
          material.categoryId === parseInt(this.categoryFilter)
        );
      }
      
      // 日期排序
      if (this.dateFilter) {
        filtered.sort((a, b) => {
          const dateA = new Date(a.uploadDate);
          const dateB = new Date(b.uploadDate);
          
          if (this.dateFilter === 'newest') {
            return dateB - dateA;
          } else {
            return dateA - dateB;
          }
        });
      }
      
      this.filteredMaterials = filtered;
    },
    
    // 搜索资料
    searchMaterials() {
      this.filterMaterials();
    },
    
    // 获取分类名称
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.name : '未分类';
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes < 1024) {
        return bytes + ' B';
      } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
      } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
      }
    },
    
    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    },
    
    // 切换全选
    toggleSelectAll() {
      this.materials.forEach(material => {
        material.selected = this.selectAll;
      });
    },
    
    // 处理文件上传
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.uploadPreview = file;
        this.newMaterial.file = file;
      }
    },
    
    // 上传资料
    uploadMaterial() {
      if (!this.canUpload) return;
      
      // 模拟上传操作
      const newId = Math.max(...this.materials.map(m => m.id)) + 1;
      
      const fileTypeMap = {
        'application/pdf': 'application/pdf',
        'image/jpeg': 'image/jpeg',
        'image/png': 'image/png',
        'video/mp4': 'video/mp4',
        'audio/mp3': 'audio/mp3',
        'application/vnd.ms-powerpoint': 'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      
      const fileType = fileTypeMap[this.uploadPreview.type] || this.uploadPreview.type;
      
      const newMaterial = {
        id: newId,
        name: this.newMaterial.name,
        categoryId: parseInt(this.newMaterial.categoryId),
        fileType: fileType,
        size: this.uploadPreview.size,
        uploadDate: new Date().toISOString(),
        url: URL.createObjectURL(this.uploadPreview),
        description: this.newMaterial.description,
        selected: false
      };
      
      this.materials.unshift(newMaterial);
      this.filterMaterials();
      
      // 重置表单
      this.newMaterial = {
        name: '',
        categoryId: '',
        description: '',
        file: null
      };
      this.uploadPreview = null;
      this.showUploadModal = false;
    },
    
    // 预览资料
    previewMaterial(material) {
      this.previewingMaterial = material;
      this.showPreviewModal = true;
    },
    
    // 关闭预览
    closePreview() {
      this.showPreviewModal = false;
      this.previewingMaterial = null;
    },
    
    // 下载资料
    downloadMaterial(material) {
      // 模拟下载操作
      console.log('下载资料:', material.name);
      
      // 实际应用中应该创建一个下载链接
      const link = document.createElement('a');
      link.href = material.url;
      link.download = material.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    
    // 显示编辑资料弹窗
    showEditModal(material) {
      this.editingMaterial = { ...material };
      this.showEditModal = true;
    },
    
    // 取消编辑
    cancelEdit() {
      this.editingMaterial = null;
      this.showEditModal = false;
    },
    
    // 保存编辑
    saveMaterialEdit() {
      if (!this.editingMaterial.name || !this.editingMaterial.categoryId) return;
      
      const index = this.materials.findIndex(m => m.id === this.editingMaterial.id);
      if (index !== -1) {
        this.materials[index] = { ...this.materials[index], ...this.editingMaterial };
      }
      
      this.filterMaterials();
      this.cancelEdit();
    },
    
    // 确认删除单个资料
    confirmDeleteMaterial(material) {
      this.materialToDelete = material;
      this.deleteMode = 'single';
      this.showDeleteConfirm = true;
    },
    
    // 确认删除选中的资料
    confirmDeleteSelected() {
      this.deleteMode = 'multiple';
      this.showDeleteConfirm = true;
    },
    
    // 取消删除
    cancelDelete() {
      this.materialToDelete = null;
      this.showDeleteConfirm = false;
    },
    
    // 执行删除操作
    deleteMaterial() {
      if (this.deleteMode === 'single' && this.materialToDelete) {
        this.materials = this.materials.filter(m => m.id !== this.materialToDelete.id);
      } else if (this.deleteMode === 'multiple') {
        this.materials = this.materials.filter(m => !m.selected);
      }
      
      this.filterMaterials();
      this.cancelDelete();
      this.selectAll = false;
    }
  }
}
</script>

<style scoped>
.training-materials-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
  color: #1a1a1a;
}

/* 功能区域样式 */
.function-area {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

.search-area {
  display: flex;
  gap: 10px;
}

.search-area input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  width: 240px;
}

.search-area select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  min-width: 120px;
}

.upload-btn {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.upload-btn:hover {
  background-color: #40a9ff;
}

/* 资料列表样式 */
.materials-list {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

th {
  background-color: #fafafa;
  color: #5c5c5c;
  font-weight: 500;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 30px 0;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 8px;
}

.actions button {
  padding: 4px 8px;
  background-color: transparent;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 12px;
  cursor: pointer;
}

.actions button:hover {
  color: #1890ff;
  border-color: #1890ff;
}

/* 批量操作 */
.batch-actions {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.batch-actions button {
  padding: 6px 16px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.batch-actions button:hover {
  background-color: #ff7875;
}

/* 弹窗样式 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  width: 500px;
  max-width: 90%;
}

.preview-modal {
  width: 800px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.preview-content {
  overflow: auto;
  max-height: 60vh;
}

.preview-content img {
  max-width: 100%;
  max-height: 60vh;
  display: block;
  margin: 0 auto;
}

.no-preview {
  text-align: center;
  padding: 40px 0;
  color: #8c8c8c;
}

.no-preview button {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
}

.modal-footer {
  padding: 10px 20px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  padding: 6px 16px;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn {
  padding: 6px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn {
  padding: 6px 16px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.form-group textarea {
  resize: vertical;
}

.upload-preview {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.upload-preview p {
  margin: 5px 0;
  font-size: 14px;
}
</style> 