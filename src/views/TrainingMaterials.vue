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
  name: 'TrainingMaterials',
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
    // 是否有选中的项目
    anySelected() {
      return this.materials.some(material => material.selected);
    },
    
    // 选中的项目数量
    selectedCount() {
      return this.materials.filter(material => material.selected).length;
    },
    
    // 是否可以上传
    canUpload() {
      return (
        this.newMaterial.name && 
        this.newMaterial.categoryId && 
        this.newMaterial.file
      );
    },
    
    // 预览文件类型判断
    isPreviewablePdf() {
      return this.previewingMaterial && this.previewingMaterial.fileType === 'application/pdf';
    },
    
    isPreviewableImage() {
      return this.previewingMaterial && this.previewingMaterial.fileType.startsWith('image/');
    },
    
    isPreviewableVideo() {
      return this.previewingMaterial && this.previewingMaterial.fileType.startsWith('video/');
    },
    
    isPreviewableAudio() {
      return this.previewingMaterial && this.previewingMaterial.fileType.startsWith('audio/');
    }
  },
  created() {
    this.loadMaterials();
  },
  methods: {
    // 加载资料列表
    loadMaterials() {
      // 模拟从API获取资料列表
      this.materials = [
        {
          id: 1,
          name: '装甲车辆操作手册',
          categoryId: 4,
          fileType: 'application/pdf',
          size: 2500000,
          uploadDate: new Date('2023-05-15'),
          description: '装甲车辆各系统操作指南与维护保养说明',
          url: 'https://example.com/files/manual.pdf',
          selected: false
        },
        {
          id: 2,
          name: '战术训练视频教程',
          categoryId: 2,
          fileType: 'video/mp4',
          size: 15000000,
          uploadDate: new Date('2023-06-20'),
          description: '小组战术训练视频教程，包含基本阵型和战术配合',
          url: 'https://example.com/files/tactics.mp4',
          selected: false
        },
        {
          id: 3,
          name: '通信设备介绍PPT',
          categoryId: 3,
          fileType: 'application/vnd.ms-powerpoint',
          size: 5000000,
          uploadDate: new Date('2023-07-10'),
          description: '军用通信设备结构和使用方法详解',
          url: 'https://example.com/files/communication.ppt',
          selected: false
        },
        {
          id: 4,
          name: '武器装备仿真教程',
          categoryId: 1,
          fileType: 'application/pdf',
          size: 8000000,
          uploadDate: new Date('2023-08-05'),
          description: '武器装备仿真训练系统使用指南',
          url: 'https://example.com/files/simulation.pdf',
          selected: false
        },
        {
          id: 5,
          name: '急救训练音频讲解',
          categoryId: 5,
          fileType: 'audio/mp3',
          size: 3000000,
          uploadDate: new Date('2023-09-15'),
          description: '战场急救技能训练音频讲解',
          url: 'https://example.com/files/firstaid.mp3',
          selected: false
        }
      ];
      
      this.filterMaterials();
    },
    
    // 根据筛选条件和搜索关键词过滤资料
    filterMaterials() {
      let filtered = [...this.materials];
      
      // 分类筛选
      if (this.categoryFilter) {
        filtered = filtered.filter(m => m.categoryId === parseInt(this.categoryFilter));
      }
      
      // 关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        filtered = filtered.filter(m => 
          m.name.toLowerCase().includes(keyword) || 
          m.description.toLowerCase().includes(keyword)
        );
      }
      
      // 日期排序
      if (this.dateFilter === 'newest') {
        filtered.sort((a, b) => b.uploadDate - a.uploadDate);
      } else if (this.dateFilter === 'oldest') {
        filtered.sort((a, b) => a.uploadDate - b.uploadDate);
      }
      
      this.filteredMaterials = filtered;
    },
    
    // 搜索资料
    searchMaterials() {
      this.filterMaterials();
    },
    
    // 切换全选
    toggleSelectAll() {
      this.materials.forEach(material => {
        material.selected = this.selectAll;
      });
    },
    
    // 获取分类名称
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.name : '未分类';
    },
    
    // 格式化文件大小
    formatFileSize(size) {
      if (size < 1024) {
        return size + ' B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
      } else if (size < 1024 * 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
      } else {
        return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      }
    },
    
    // 格式化日期
    formatDate(date) {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    },
    
    // 处理文件上传
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.newMaterial.file = file;
        this.uploadPreview = {
          name: file.name,
          size: file.size,
          type: file.type
        };
        
        // 如果未填写名称，使用文件名作为资料名称
        if (!this.newMaterial.name) {
          // 去掉扩展名
          const nameParts = file.name.split('.');
          if (nameParts.length > 1) {
            nameParts.pop();
          }
          this.newMaterial.name = nameParts.join('.');
        }
      }
    },
    
    // 上传资料
    uploadMaterial() {
      if (!this.canUpload) return;
      
      // 模拟上传过程
      const newId = Math.max(...this.materials.map(m => m.id), 0) + 1;
      
      // 创建URL（实际应用中应该是上传到服务器后返回的URL）
      const fileUrl = URL.createObjectURL(this.newMaterial.file);
      
      // 添加新资料
      this.materials.push({
        id: newId,
        name: this.newMaterial.name,
        categoryId: parseInt(this.newMaterial.categoryId),
        fileType: this.newMaterial.file.type,
        size: this.newMaterial.file.size,
        uploadDate: new Date(),
        description: this.newMaterial.description,
        url: fileUrl,
        selected: false
      });
      
      // 重置表单
      this.newMaterial = {
        name: '',
        categoryId: '',
        description: '',
        file: null
      };
      this.uploadPreview = null;
      
      // 关闭弹窗
      this.showUploadModal = false;
      
      // 刷新筛选
      this.filterMaterials();
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
      // 创建一个链接元素
      const link = document.createElement('a');
      link.href = material.url;
      link.download = material.name;
      
      // 模拟点击下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    
    // 显示编辑弹窗
    showEditModal(material) {
      this.editingMaterial = { ...material };
      this.showEditModal = true;
    },
    
    // 取消编辑
    cancelEdit() {
      this.showEditModal = false;
      this.editingMaterial = null;
    },
    
    // 保存编辑
    saveMaterialEdit() {
      if (!this.editingMaterial) return;
      
      // 找到要编辑的资料
      const index = this.materials.findIndex(m => m.id === this.editingMaterial.id);
      if (index !== -1) {
        // 更新资料
        this.materials[index] = {
          ...this.materials[index],
          name: this.editingMaterial.name,
          categoryId: parseInt(this.editingMaterial.categoryId),
          description: this.editingMaterial.description
        };
      }
      
      // 关闭弹窗
      this.cancelEdit();
      
      // 刷新筛选
      this.filterMaterials();
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
      this.showDeleteConfirm = false;
      this.materialToDelete = null;
      this.deleteMode = 'single';
    },
    
    // 执行删除
    deleteMaterial() {
      if (this.deleteMode === 'single' && this.materialToDelete) {
        // 删除单个资料
        const index = this.materials.findIndex(m => m.id === this.materialToDelete.id);
        if (index !== -1) {
          this.materials.splice(index, 1);
        }
      } else if (this.deleteMode === 'multiple') {
        // 删除选中的资料
        this.materials = this.materials.filter(m => !m.selected);
      }
      
      // 关闭弹窗
      this.cancelDelete();
      
      // 刷新筛选
      this.filterMaterials();
    }
  }
}
</script>

<style scoped>
.training-materials-container {
  width: 100%;
  padding: 0;
}

.page-title {
  font-size: 20px;
  color: #0C2D48;
  margin-bottom: 20px;
  font-weight: 500;
}

.function-area {
  margin-bottom: 20px;
}

.search-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-area input,
.search-area select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.search-area input {
  flex: 1;
  min-width: 200px;
}

.upload-btn {
  padding: 8px 16px;
  background-color: #0C2D48;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.materials-list {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  background-color: #0C2D48;
  color: white;
  padding: 10px;
  text-align: left;
}

tbody td {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.actions {
  display: flex;
  gap: 5px;
}

.actions button {
  padding: 5px 10px;
  background-color: #0C2D48;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #666;
}

.batch-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.batch-actions button {
  padding: 8px 16px;
  background-color: #d9534f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 101;
  width: 500px;
  max-width: 90%;
}

.preview-modal {
  width: 800px;
  max-width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.upload-preview {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-footer button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.confirm-btn {
  background-color: #0C2D48;
  color: white;
}

.delete-btn {
  background-color: #d9534f;
  color: white;
}

.preview-content {
  max-height: 600px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.no-preview {
  text-align: center;
  padding: 40px;
}

.no-preview button {
  margin-top: 15px;
  padding: 8px 16px;
  background-color: #0C2D48;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .search-area {
    flex-direction: column;
    align-items: stretch;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style> 